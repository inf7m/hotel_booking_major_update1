import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { roomAPI, hotelAPI, resolveAsset } from "../utils/api";
import ImageUploaderMulti from "../components/ImageUploaderMulti";

export default function HotelRooms() {
    // hotel_id từ URL
    const { id } = useParams();

    const [hotel, setHotel] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    // modal
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState({
        room_number: "",
        room_type: "",
        price: "",
        capacity: 2,
        description: "",
        image_urls: [],
        amenitiesText: "",
    });

    const multiTextRef = useRef(null);

    const resetForm = () => {
        setEditingId(null);
        setForm({
            room_number: "",
            room_type: "",
            price: "",
            capacity: 2,
            description: "",
            image_urls: [],
            amenitiesText: "",
        });
    };

    // ==============================
    // LOAD HOTEL + FILTER ROOMS
    // ==============================
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);

                const [hotelRes, roomRes] = await Promise.all([
                    hotelAPI.getById(id),
                    roomAPI.getByHotelId(id), // có thể trả ALL rooms
                ]);

                const hotelData = hotelRes.data.hotel;
                const allRooms = roomRes.data.rooms || [];

                const hotelId = String(id);

                // ⭐ FILTER CHUẨN
                const filteredRooms = allRooms.filter((room) => {
                    const roomHotelId =
                        room.hotel_id?._id || room.hotel_id;
                    return String(roomHotelId) === hotelId;
                });

                setHotel(hotelData);
                setRooms(filteredRooms);
            } catch (err) {
                alert(err?.response?.data?.message || "Lỗi tải danh sách phòng");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    // ==============================
    // FORM HANDLERS
    // ==============================
    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((s) => ({ ...s, [name]: value }));
    };

    const openCreate = () => {
        resetForm();
        setOpen(true);
    };

    const openEdit = (room) => {
        setEditingId(room.id);

        let amenitiesText = "";
        try {
            amenitiesText = Array.isArray(room.amenities)
                ? room.amenities.join(", ")
                : JSON.parse(room.amenities || "[]").join(", ");
        } catch {}

        let imageUrls = [];
        try {
            imageUrls = Array.isArray(room.image_urls)
                ? room.image_urls
                : JSON.parse(room.image_urls || "[]");
        } catch {}

        const allImages = [
            ...(room.image_url ? [room.image_url] : []),
            ...imageUrls,
        ].filter(Boolean);

        setForm({
            room_number: room.room_number || "",
            room_type: room.room_type || "",
            price: room.price || "",
            capacity: room.capacity || 2,
            description: room.description || "",
            image_urls: allImages,
            amenitiesText,
        });

        setOpen(true);
    };

    const addMultiByText = () => {
        const raw = multiTextRef.current?.value?.trim();
        if (!raw) return;

        const parts = raw
            .split(/[\n,]+/)
            .map((s) => s.trim())
            .filter(Boolean);

        setForm((s) => ({
            ...s,
            image_urls: [...s.image_urls, ...parts].slice(0, 10),
        }));

        multiTextRef.current.value = "";
    };

    // ==============================
    // CREATE / UPDATE ROOM
    // ==============================
    const submitRoom = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const [firstImage, ...restImages] = form.image_urls;

            const payload = {
                hotel_id: id,
                room_number: form.room_number || null,
                room_type: form.room_type,
                price: Number(form.price) || 0,
                capacity: Number(form.capacity) || 1,
                description: form.description,
                image_url: firstImage || "",
                image_urls: restImages,
                amenities: form.amenitiesText
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean),
            };

            if (editingId) {
                await roomAPI.update(editingId, payload);
            } else {
                await roomAPI.create(payload);
            }

            // reload rooms
            const r = await roomAPI.getByHotelId(id);
            const hotelId = String(id);

            setRooms(
                (r.data.rooms || []).filter(
                    (room) =>
                        String(room.hotel_id?._id || room.hotel_id) === hotelId
                )
            );

            setOpen(false);
            resetForm();
        } catch (err) {
            alert(err?.response?.data?.message || "Lỗi lưu phòng");
        } finally {
            setSaving(false);
        }
    };

    const removeRoom = async (roomId) => {
        if (!window.confirm("Xóa phòng này?")) return;
        try {
            await roomAPI.delete(roomId);
            setRooms((s) => s.filter((x) => x.id !== roomId));
        } catch (err) {
            alert(err?.response?.data?.message || "Lỗi xóa phòng");
        }
    };

    // ==============================
    // RENDER
    // ==============================
    if (loading) return <div className="p-8">Đang tải…</div>;

    return (
        <div className="max-w-5xl mx-auto p-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">
                    Phòng của khách sạn: {hotel?.name}
                </h1>
                <button
                    className="px-4 py-2 bg-green-600 text-white rounded-md"
                    onClick={openCreate}
                >
                    + Thêm phòng
                </button>
            </div>

            {rooms.length === 0 ? (
                <div className="text-center text-gray-500 py-16">
                    Chưa có phòng nào
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {rooms.map((r) => {
                        const images = [
                            ...(r.image_url ? [r.image_url] : []),
                            ...(Array.isArray(r.image_urls)
                                ? r.image_urls
                                : []),
                        ];

                        return (
                            <div key={r.id} className="bg-white rounded-xl shadow p-4">
                                <img
                                    src={
                                        resolveAsset(images[0]) ||
                                        "https://via.placeholder.com/600x360"
                                    }
                                    className="w-full h-40 object-cover rounded-lg"
                                    alt={r.room_type}
                                />
                                <div className="mt-3">
                                    <div className="font-semibold">
                                        {r.room_type} {r.room_number && `• ${r.room_number}`}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Tối đa {r.capacity} khách
                                    </div>
                                    <div className="text-blue-600 font-semibold mt-1">
                                        {new Intl.NumberFormat("vi-VN", {
                                            style: "currency",
                                            currency: "VND",
                                        }).format(r.price)}
                                    </div>
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <button
                                        onClick={() => openEdit(r)}
                                        className="px-3 py-2 bg-blue-600 text-white rounded-md"
                                    >
                                        Sửa
                                    </button>
                                    <button
                                        onClick={() => removeRoom(r.id)}
                                        className="px-3 py-2 bg-red-600 text-white rounded-md"
                                    >
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

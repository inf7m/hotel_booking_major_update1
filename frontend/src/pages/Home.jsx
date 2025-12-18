import {useState, useEffect} from "react";
import {Link, useLocation} from "react-router-dom";
import api, {resolveAsset} from "../utils/api";
import TrendingDestinations from "../components/TrendingDestinations";

// Danh sách tiện nghi hiển thị trong dropdown
const AMENITY_OPTIONS = [
    "Free WiFi",
    "2 swimming pools",
    "Airport shuttle",
    "Free parking",
    "Family rooms",
    "Beachfront",
    "Non-smoking rooms",
    "Restaurant",
    "Room service",
    "24-hour front desk",
    "Superb breakfast",
];

export default function Home() {
    const [userLocation, setUserLocation] = useState(null); // { lat, lng }
    const location = useLocation();
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSearched, setIsSearched] = useState(false);

    const [filters, setFilters] = useState({
        search: "",
        city: "",
        rating: "",
        amenities: [], // mảng tiện nghi đã chọn
    });

    const [isAmenityDropdownOpen, setIsAmenityDropdownOpen] = useState(false);

    // ===== LOAD BAN ĐẦU / CITY TỪ URL =====
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const cityParam = params.get("city");

        if (cityParam) {
            setFilters((prev) => ({...prev, city: cityParam}));
            handleSearchWithCity(cityParam);
        } else {
            loadPopularHotels();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);

    const loadPopularHotels = async () => {
        try {
            setLoading(true);
            setError(null);
            setIsSearched(false);
            const res = await api.get("/hotels");
            setHotels(res.data.hotels || []);
        } catch (err) {
            console.error("Error loading hotels:", err);
            setError("Không thể tải danh sách khách sạn");
        } finally {
            setLoading(false);
        }
    };

    const handleSearchWithCity = async (city) => {
        try {
            setLoading(true);
            setError(null);
            setIsSearched(true);

            const res = await api.get(
                `/hotels/search?city=${encodeURIComponent(city)}`
            );
            if (res.data.success) {
                setHotels(res.data.data || res.data.hotels || []);
                if (res.data.count === 0) {
                    setError(`Không tìm thấy khách sạn ở ${city}`);
                }
            }
        } catch (err) {
            console.error("Error searching hotels:", err);
            setError("Có lỗi xảy ra khi tìm kiếm");
        } finally {
            setLoading(false);
        }
    };

    // ===== FORM HANDLERS =====
    const handleFilterChange = (e) => {
        const {name, value} = e.target;
        setFilters((prev) => ({...prev, [name]: value}));
    };

    // toggle 1 tiện nghi trong mảng
    const toggleAmenity = (value) => {
        setFilters((prev) => {
            const exists = prev.amenities.includes(value);
            const amenities = exists
                ? prev.amenities.filter((a) => a !== value)
                : [...prev.amenities, value];
            return {...prev, amenities};
        });
    };

    const clearAmenities = () => {
        setFilters((prev) => ({...prev, amenities: []}));
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            setIsSearched(true);
            setIsAmenityDropdownOpen(false);

            const params = new URLSearchParams();
            if (filters.search) params.append("name", filters.search);
            if (filters.city) params.append("city", filters.city);
            if (filters.rating) params.append("rating", filters.rating);

            // gửi mỗi tiện nghi thành 1 param `amenities`
            if (filters.amenities && filters.amenities.length) {
                filters.amenities.forEach((am) => params.append("amenities", am));
            }

            const res = await api.get(`/hotels/search?${params.toString()}`);
            if (res.data.success) {
                setHotels(res.data.data || res.data.hotels || []);
                if (res.data.count === 0) {
                    setError("Không tìm thấy khách sạn phù hợp");
                }
            }
        } catch (err) {
            console.error("Error searching hotels:", err);
            setError("Có lỗi xảy ra khi tìm kiếm");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFilters({
            search: "",
            city: "",
            rating: "",
            amenities: [],
        });
        setIsSearched(false);
        setError(null);
        setIsAmenityDropdownOpen(false);
        loadPopularHotels();
        window.history.pushState({}, "", "/");
    };

    // ===== HELPERS =====
    const formatPrice = (price) => {
        if (price || price === 0) {
            return new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
            }).format(price);
        }
        return "Liên hệ";
    };

    const getHotelImage = (hotel) => {
        if (hotel.image_url) return resolveAsset(hotel.image_url);

        try {
            let imageUrls = hotel.image_urls;
            if (typeof imageUrls === "string" && imageUrls) {
                imageUrls = JSON.parse(imageUrls);
            }
            if (Array.isArray(imageUrls) && imageUrls.length > 0) {
                return resolveAsset(imageUrls[0]);
            }
        } catch (e) {
            console.error("Error parsing image_urls:", e);
        }
        return "https://via.placeholder.com/400x250?text=No+Image";
    };

    // text hiển thị trên nút tiện nghi
    const amenityLabel = (() => {
        const list = filters.amenities;
        if (!list.length) return "Chọn tiện nghi";
        if (list.length === 1) return list[0];
        if (list.length === 2) return `${list[0]}, ${list[1]}`;
        return `${list[0]}, ${list[1]} +${list.length - 2}`;
    })();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-4xl font-bold mb-4">
                        Tìm khách sạn hoàn hảo cho chuyến đi của bạn
                    </h1>
                    <p className="text-xl mb-8 text-blue-100">
                        Hơn 2 triệu khách sạn trên toàn thế giới
                    </p>

                    {/* Search form */}
                    <form
                        onSubmit={handleSearch}
                        className="bg-white rounded-lg shadow-xl p-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-stretch">
                            {/* Tên khách sạn */}
                            <input
                                type="text"
                                name="search"
                                placeholder="Tìm kiếm khách sạn..."
                                value={filters.search}
                                onChange={handleFilterChange}
                                className="px-4 py-3 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />

                            {/* Thành phố */}
                            <input
                                type="text"
                                name="city"
                                placeholder="Thành phố"
                                value={filters.city}
                                onChange={handleFilterChange}
                                className="px-4 py-3 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />

                            {/* Đánh giá */}
                            <div className="relative">
                                <select
                                    name="rating"
                                    value={filters.rating}
                                    onChange={handleFilterChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none"
                                >
                                    <option value="">Tất cả đánh giá</option>
                                    <option value="4.5">4.5+ ⭐</option>
                                    <option value="4.0">4.0+ ⭐</option>
                                    <option value="3.5">3.5+ ⭐</option>
                                    <option value="3.0">3.0+ ⭐</option>
                                </select>
                                <span
                                    className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
                  ▾
                </span>
                            </div>

                            {/* Tiện nghi: dropdown đẹp với checkbox */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsAmenityDropdownOpen((o) => !o)}
                                    className="w-full h-full px-4 py-3 border border-gray-300 rounded-md bg-white flex items-center justify-between text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <div className="flex flex-col text-left">
                    <span className="text-[10px] font-semibold uppercase text-gray-400 tracking-wide">
                      Tiện nghi
                    </span>
                                        <span className="text-sm truncate">{amenityLabel}</span>
                                    </div>
                                    <span className="ml-3 text-gray-500">▾</span>
                                </button>

                                {isAmenityDropdownOpen && (
                                    <div
                                        className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-30 max-h-64 overflow-y-auto">
                                        <div className="px-3 py-2 border-b flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500 uppercase">
                        Chọn tiện nghi
                      </span>
                                            {filters.amenities.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={clearAmenities}
                                                    className="text-[10px] text-blue-600 hover:underline"
                                                >
                                                    Xóa tất cả
                                                </button>
                                            )}
                                        </div>
                                        {AMENITY_OPTIONS.map((label) => (
                                            <label
                                                key={label}
                                                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    checked={filters.amenities.includes(label)}
                                                    onChange={() => toggleAmenity(label)}
                                                />
                                                {label}
                                            </label>
                                        ))}
                                        {AMENITY_OPTIONS.length === 0 && (
                                            <div className="px-3 py-2 text-xs text-gray-400">
                                                Chưa cấu hình tiện nghi.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Nút tìm + reset */}
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md transition-colors duration-200 shadow-md hover:shadow-lg"
                                >
                                    Tìm kiếm
                                </button>
                                {isSearched && (
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-md transition-colors duration-200"
                                        title="Đặt lại"
                                    >
                                        ↺
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Trending Destinations */}
            {!isSearched && !loading && <TrendingDestinations/>}

            {/* Danh sách khách sạn */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {isSearched
                            ? `Kết quả tìm kiếm${
                                hotels.length ? ` (${hotels.length} khách sạn)` : ""
                            }`
                            : "Khách sạn phổ biến"}
                    </h2>
                    {isSearched && hotels.length > 0 && (
                        <button
                            onClick={handleReset}
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                            Xem tất cả khách sạn →
                        </button>
                    )}
                </div>

                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"/>
                        <p className="mt-4 text-gray-600">Đang tải...</p>
                    </div>
                )}

                {error && !loading && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                        <p className="text-sm text-yellow-700">{error}</p>
                    </div>
                )}

                {!loading && !error && hotels.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {hotels.map((hotel) => (
                            <Link
                                key={hotel.id}
                                to={`/hotels/${hotel.id}`}
                                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 group"
                            >
                                <div className="relative h-48 overflow-hidden bg-gray-200">
                                    <img
                                        src={getHotelImage(hotel)}
                                        alt={hotel.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        onError={(e) => {
                                            e.currentTarget.src =
                                                "https://via.placeholder.com/400x250?text=No+Image";
                                        }}
                                    />
                                    {hotel.rating > 0 && (
                                        <div
                                            className="absolute top-3 right-3 flex items-center bg-blue-600 text-white px-3 py-1 rounded-full shadow-lg">
                                            <span className="font-semibold">★ {hotel.rating}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors mb-1">
                                        {hotel.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-2 flex items-center">
                                        <span className="w-4 h-4 mr-1">📍</span>
                                        {hotel.city}
                                    </p>
                                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                                        {hotel.description ||
                                            "Khách sạn sang trọng với đầy đủ tiện nghi"}
                                    </p>
                                    {hotel.review_count > 0 && (
                                        <p className="text-xs text-gray-500 mb-3">
                                            {hotel.review_count} đánh giá
                                        </p>
                                    )}
                                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                                        <span className="text-sm text-gray-600">Giá từ</span>
                                        <span className="text-lg font-bold text-blue-600">
                        {formatPrice(hotels.price || hotels.min_price)}
                    </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {!loading && !error && hotels.length === 0 && isSearched && (
                    <div className="text-center py-12 bg-white rounded-lg shadow-md">
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                            Không tìm thấy khách sạn
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Không có khách sạn nào phù hợp với tìm kiếm của bạn.
                        </p>
                        <div className="mt-6">
                            <button
                                onClick={handleReset}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                Xem tất cả khách sạn
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

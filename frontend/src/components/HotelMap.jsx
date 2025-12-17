import React, { useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const HotelMap = ({ latitude, longitude, hotelName, address }) => {
    const lat = parseFloat(latitude) || 10.762622; // default HCM
    const lng = parseFloat(longitude) || 106.660172;

    const markerRef = useRef();

    useEffect(() => {
        // Open popup when marker is mounted
        if (markerRef.current) {
            markerRef.current.openPopup();
        }
    }, []);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Vị trí</h2>
            {address && <p className="text-gray-600 mb-4">{address}</p>}

            <MapContainer
                center={[lat, lng]}
                zoom={15}
                scrollWheelZoom={false} // optional: disable scroll zoom
                style={{
                    width: "100%",
                    height: "300px",
                    borderRadius: "8px",
                    position: "relative",
                    zIndex: 0, // Make sure map is below popup buttons
                }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <Marker position={[lat, lng]} ref={markerRef}>
                    <Popup
                        // Popup container style to prevent overflow
                        className="leaflet-popup-content-wrapper"
                        autoPan={true} // Auto pan to fit popup fully in map
                        keepInView={true} // Keep popup in map view
                    >
                        {hotelName}
                    </Popup>
                </Marker>
            </MapContainer>

            <button
                onClick={() =>
                    window.open(
                        `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}`,
                        "_blank"
                    )
                }
                className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                Xem trên OpenStreetMap
            </button>
        </div>
    );
};

export default HotelMap;

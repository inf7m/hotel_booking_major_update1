const geolib = require("geolib"); //dependency

function getDistance(firsLatitude, firstLongitude, secondLatitude, secondLongitude) {
    const distance = geolib.getDistance(
        {latitude: firsLatitude, longitude: firstLongitude},
        {latitude: secondLatitude, longitude: secondLongitude}
    );
    return distance/1000; // display in km
}

// Demo-function La Vela Saigon Hotel to Nha Trang / air-line / as the crow-flies
// const result = getDistance(10.788694,106.68536,12.2388,109.1967);
// console.log(result);
const fetch = require("node-fetch") // nếu chạy Node.js, frontend thì dùng fetch mặc định
async function openRouteMatrix(hotelLat, hotelLng, userLat, userLng) {
    try {
        const body = {
            locations: [
                [hotelLng, hotelLat], // khách sạn
                [userLng, userLat],   // user
            ],
            metrics: ["distance", "duration"], // có thể thêm duration
            units: "km"
        };

        const res = await fetch("https://api.openrouteservice.org/v2/matrix/driving-car", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "YOUR_API_KEY_HERE" // thay bằng API key của bạn
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        return data; // chứa distance, duration
    } catch (err) {
        console.error("OpenRouteMatrix error:", err);
        return null;
    }
}

    // Demo gọi hàm
    (async () => {
        const hotelLat = 10.788694;
        const hotelLng = 106.68536;
        const userLat = 12.2388;
        const userLng = 109.1967;

        const result = await openRouteMatrix(hotelLat, hotelLng, userLat, userLng);
        console.log(result);
    })();


let map;
let latitude, longitude;
let autocomplete;
let customDatabase = {};
let costompic ;

const AVG_TRAVEL_COST_PER_KM = 10; // e.g., $0.5 per km
const AVG_HOTEL_COST_PER_NIGHT = 6000; // Average cost per night in $
const AVG_FOOD_COST_PER_DAY = 2000; // Average daily food cost in $


function calculateBudget(distance) {
    // const travelCost = distance * AVG_TRAVEL_COST_PER_KM;
    
    if (distance<100){
        const hotelCost = 0; // Assuming 1 night for simplicity
        const foodCost = 0; // Assuming 1 day for simplicity
        const travelCost = distance * 15;
        const total=  travelCost + hotelCost + foodCost
        return {
            total:`₹${Math.floor(total)}`,
            travelCost: travelCost,
            hotelCost: hotelCost,
            foodCost: foodCost
        };
    }else{
        const hotelCost = AVG_HOTEL_COST_PER_NIGHT; // Assuming 1 night for simplicity
        const foodCost = AVG_FOOD_COST_PER_DAY; // Assuming 1 day for simplicity
        const travelCost = distance * AVG_TRAVEL_COST_PER_KM;
        let total= travelCost + hotelCost + foodCost
        if(Math.floor(total)>1000){
            total= Math.floor(total);
            total=total/1000;
            console.log(total)
        }

        return {
            total: `₹${total.toFixed(1)}k`,
            travelCost: travelCost,
            hotelCost: hotelCost,
            foodCost: foodCost
        };
    }

}

// Load the custom database from multiple JSON files
function loadDatabases() {
    const databaseUrls = ['DataBase/beaches.json', 'DataBase/mountains.json'];
    const promises = databaseUrls.map(url => fetch(url).then(response => response.json()));
    
    return Promise.all(promises)
        .then(databases => {
            // Combine all databases into one
            customDatabase = databases.reduce((acc, db) => {
                for (const category in db) {
                    if (!acc[category]) {
                        acc[category] = [];
                    }
                    acc[category] = acc[category].concat(db[category]);
                }
                
                return acc;

            }, {});
            
            console.log("Loaded customDatabase:", customDatabase); // Verify the database is loaded
        })
        .catch(error => console.error('Error loading databases:', error));
}


function displaydata(element) {
    
    const datalist = document.getElementById("content");

    // Check if the datalist element exists
    if (!datalist) {
        console.error("No element with ID 'datalist' found.");
        return;
    }

    // Clear any existing content
    datalist.innerHTML = '';
    // Check if customDatabase has content
    if (Object.keys(customDatabase).length === 0) {
        return;
    }

    // Loop through each category in the customDatabase
    for (const Category in customDatabase) {
        customDatabase[element].forEach(city => {
            // console.log(city)
            city.places.forEach(place => {
                costomloc(place.exact_location, function(photoUrl) {
                    const distance = google.maps.geometry.spherical.computeDistanceBetween(
                        new google.maps.LatLng(latitude, longitude),
                        new google.maps.LatLng(place.latitude, place.longitude)
                    ) / 1000; // Distance in kilometers    
                    // console.log(photoUrl)
                
                const listItem = document.createElement('div');
                listItem.className = 'card';  // Add a class for styling

                listItem.innerHTML = `
                    <img src="${photoUrl}" alt="img">
                <h3>${place.name}</h3>
                <p>description</p>
                `;

                datalist.appendChild(listItem);
            });
        });
    })
    }
}

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        function (position) {
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
            console.log("Latitude:", latitude, "Longitude:", longitude);
            
            // Load the databases and initialize the map and autocomplete after getting the location
            loadDatabases().then(() => {
                initMap();

                displaydata("mountains"); // Now call displaydata() after databases are loaded
            });
        },
        function (error) {
            console.error("Error getting location:", error);
        }
    );
} else {
    console.error("Geolocation is not supported by this browser.");
}

function initMap() {
    if (latitude !== undefined && longitude !== undefined) {
        const location = { lat: latitude, lng: longitude };

        // Create a map centered at the given location
        map = new google.maps.Map(document.getElementById('map'), {
            center: location,
            zoom: 14
        });

        // Fetch and display nearby Google Places and custom database places
        fetchNearbyPlaces(location);
        displayCustomPlaces();
        initAutocomplete();
    } else {
        console.error("Latitude and longitude are not defined.");
    }
}

function initAutocomplete() {
    const input = document.getElementById('autocomplete');
    autocomplete = new google.maps.places.Autocomplete(input);

    autocomplete.addListener('place_changed', function () {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
            console.error("No details available for input: '" + place.name + "'");
            return;
        }

        // Center the map on the selected place
        map.setCenter(place.geometry.location);
        map.setZoom(14);

        // Fetch and display nearby Google Places based on the selected location
        fetchNearbyPlaces(place.geometry.location);
    });
}

function fetchNearbyPlaces(location) {
    const service = new google.maps.places.PlacesService(map);
    const request = {
        location: location,
        radius: '1500',
        type: ['Tourist atraction'],
        keyword: 'Tourist'
    };

    service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            displayPlaces(results);
        } else {
            console.error('PlacesService was not successful for the following reason:', status);
        }
    });
}

function displayCustomPlaces() {
    const placesList = document.getElementById('places-list');
    for (const category in customDatabase) {
        customDatabase[category].forEach(city => {
            city.places.forEach(place => {
                costomloc(place.exact_location, function(photoUrl) {
                    const distance = google.maps.geometry.spherical.computeDistanceBetween(
                        new google.maps.LatLng(latitude, longitude),
                        new google.maps.LatLng(place.latitude, place.longitude)
                    ) / 1000; // Distance in kilometers    
                
                const budget = calculateBudget(distance);

                const listItem = document.createElement('div');
                listItem.innerHTML = `
                    <div class="container">
                        <div class="img">
                            <img src="${photoUrl}" alt="${place.name}">
                        </div>
                        <div class="info">
                            <h3>${place.name}</h3>
                             <p>${place.exact_location}</p>
                            <p>${place.description}</p>
                            <p>Distance: ${distance.toFixed(2)} km</p>
                        </div>
                        <div class="price">
                            <h3>BUDGET</h3>
                            <p>FOR SINGLE/DOUBLE PERSON:</p>
                            <span>${budget.total}</span>
                        </div>
                    </div>
                `;
                    
                placesList.appendChild(listItem);
                

                // Add a marker for each custom place on the map
                const marker = new google.maps.Marker({
                    position: { lat: place.latitude, lng: place.longitude },
                    map: map,
                    title: place.name
                
                });
            });
        });
    });
}
}

function globalSearch() {
    const searchTerm = document.getElementById('autocomplete').value.trim().toLowerCase();

    // Check if the search term matches a category in the custom database
    
    if (customDatabase[searchTerm]) {
        const placesList = document.getElementById('places-list');
        placesList.innerHTML = '';
        displayCustomCategoryPlaces(searchTerm);

        // Display other places from Google Places API
        const service = new google.maps.places.PlacesService(map);
        const request = {
            query: searchTerm,
            fields: ['name', 'geometry', 'photos', 'formatted_address'],
        };
        service.textSearch(request, function (results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                displayGlobalPlaces(results);
                map.setCenter(results[0].geometry.location);
            } else {
                console.error('PlacesService was not successful for the following reason:', status);
            }
        });
    } else {
        // If the search term doesn't match, perform a global search using Google Places API
        const service = new google.maps.places.PlacesService(map);
        const request = {
            query: searchTerm,
            fields: ['name', 'geometry', 'photos', 'formatted_address'],
        };

        service.textSearch(request, function (results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                const placesList = document.getElementById('places-list');
                placesList.innerHTML = '';
                // console.log(results)
                displayGlobalPlaces(results);
                map.setCenter(results[0].geometry.location);
            } else {
                console.error('PlacesService was not successful for the following reason:', status);
            }
        });
    }
}


function costomloc(location, callback) {
    const service = new google.maps.places.PlacesService(map);
    const request = {
        query: location,
        fields: ['name', 'geometry', 'photos', 'formatted_address'],
    };
    
    service.textSearch(request, function (results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            const photoUrl = results[0].photos && results[0].photos.length > 0 ? 
                results[0].photos[0].getUrl({ maxWidth: 200, maxHeight: 200 }) : 
                'https://via.placeholder.com/200';
            
            callback(photoUrl);
        } else {
            console.error('PlacesService was not successful for the following reason:', status);
            callback('https://via.placeholder.com/200'); // Fallback to a placeholder image on failure
        }
    });
}




function displayCustomCategoryPlaces(category) {
    const placesList = document.getElementById('places-list');
    placesList.innerHTML = '';  // Clear the list before adding new places

    customDatabase[category].forEach(city => {
        city.places.forEach(place => {
            // Fetch the custom location image asynchronously
            costomloc(place.exact_location, function(photoUrl) {
                const distance = google.maps.geometry.spherical.computeDistanceBetween(
                    new google.maps.LatLng(latitude, longitude),
                    new google.maps.LatLng(place.latitude, place.longitude)
                ) / 1000; // Distance in kilometers

                const budget = calculateBudget(distance);

                const listItem = document.createElement('div');
                listItem.innerHTML = `
                    <div class="container">
                        <div class="img">
                            <img src="${photoUrl}" alt="${place.name}">
                        </div>
                        <div class="info">
                            <h3>${place.name}</h3>
                            <p>${place.exact_location}</p>
                            <p>${place.description}</p>
                            <p>Distance: ${distance.toFixed(2)} km</p>
                        </div>
                        <div class="price">
                            <h3>BUDGET</h3>
                            <p>FOR SINGLE/DOUBLE PERSON:</p>
                            <span>${budget.total}</span>
                        </div>
                    </div>
                `;

                placesList.appendChild(listItem);

                // Add a marker for each custom place on the map
                const marker = new google.maps.Marker({
                    position: { lat: place.latitude, lng: place.longitude },
                    map: map,
                    title: place.name
                });
            });
        });
    });
}
function displayPlaces(places) {
    const placesList = document.getElementById('places-list');
    places.forEach(place => {
        // console.log(place)
        const photoUrl = place.photos && place.photos.length > 0 ? place.photos[0].getUrl({ maxWidth: 200, maxHeight: 200 }) : 'https://via.placeholder.com/200';
        const distance = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(latitude, longitude),
            place.geometry.location
        ) / 1000; // Distance in kilometers

        const budget = calculateBudget(distance);

        const listItem = document.createElement('div');
        listItem.innerHTML = `
            <div class="container">
                <div class="img">
                    <img src="${photoUrl}" alt="${place.name}">
                </div>
                <div class="info">
                    <h3>${place.name}</h3>
                     <p>${place.exact_location}</p>
                    <p>${place.vicinity}</p>
                    <p>Distance: ${distance.toFixed(2)} km</p>
                </div>
                <div class="price">
                    <h3>BUDGET</h3>
                    <p>FOR SINGLE/DOUBLE PERSON:</p>
                    <span>${budget.total}</span>
                </div>
            </div>
        `;

        placesList.appendChild(listItem);

        // Add a marker for each Google Place on the map
        const marker = new google.maps.Marker({
            position: place.geometry.location,
            map: map,
            title: place.name
        });
    });
}

function displayGlobalPlaces(places) {
    const placesList = document.getElementById('places-list');

    places.forEach(place => {
        // console.log(place)
        const photoUrl = place.photos && place.photos.length > 0 ? place.photos[0].getUrl({ maxWidth: 200, maxHeight: 200 }) : 'https://via.placeholder.com/200';
        const distance = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(latitude, longitude),
            place.geometry.location
        ) / 1000;
        const budget = calculateBudget(distance);


        const listItem = document.createElement('div');
        listItem.innerHTML = `
            <div class="container">
                <div class="img">
                    <img src="${photoUrl}" alt="${place.name}">
                </div>
                <div class="info">
                    <h3>${place.name}</h3>
                     <p>${place.exact_location}</p>
                    <p>${place.formatted_address}</p>
                    <p>Distance: ${distance.toFixed(2)} km</p>
                </div>
                <div class="price">
                    <h3>BUDGET</h3>
                    <p>FOR SINGLE/DOUBLE PERSON:</p>
                    <span>${budget.total}</span>
                </div>
            </div>
        `;

        placesList.appendChild(listItem);

        // Add a marker for each Global Place on the map
        const marker = new google.maps.Marker({
            position: place.geometry.location,
            map: map,
            title: place.name
        });
    });
}
// function displaydata() {
//     const datalist = document.getElementById("datalist");

//     // Check if the datalist element exists
//     if (!datalist) {
//         console.error("No element with ID 'datalist' found.");
//         return;
//     }

//     // Clear any existing content
//     datalist.innerHTML = '';

//     // Log customDatabase to verify its content
//     console.log("customDatabase:", customDatabase);

//     // Check if customDatabase has content
//     if (Object.keys(customDatabase).length === 0) {
//         console.error("customDatabase is empty.");
//         return;
//     }

//     // Loop through each category in the customDatabase
//     for (const category in customDatabase) {
//         console.log(`Category: ${category}`);

//         customDatabase[category].forEach(city => {
//             city.places.forEach(place => {
//                 console.log(`Adding place: ${place.name}`);

//                 const listItem = document.createElement('div');
//                 listItem.className = 'card';  // Add a class for styling

//                 listItem.innerHTML = `
//                     <div class="content">
//                         <div class="name">
//                             <h3>${place.name}</h3>
//                         </div>
//                         <div class="description">
//                             <p>${place.description}</p>
//                         </div>
//                         <div class="location">
//                             <p>${place.exact_location}</p>
//                         </div>
//                     </div>
//                 `;

//                 datalist.appendChild(listItem);
//             });
//         });
//     }
// }

// Call displaydata to ensure it runs
// displaydata();

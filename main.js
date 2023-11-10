
// Variable to check if we are processing from overpass API
var processingBounds = false;
var pendingBounds = null;
// Object to store routes
var routes={};

// Set modal variable and create a listener on its close button
const modal = document.querySelector("#routeInfoModal");
modal.querySelector(".close").addEventListener("click",function(){
    modal.style.display = "none";
});

// Create a leaflet map using OSM tiles
const map = L.map('map').fitWorld();
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom:19,
    minZoom:11,
    attribution: '© OpenStreetMap'
}).addTo(map);


// Default location (Örebro)
map.setView([59.28, 15.229], 12);

// Scan map
scanMap(map.getBounds());

// Locate the user
map.locate({setView: true});

// When user is located, add marker
map.on('locationfound', function(e){
    console.log("User located.")
    var radius = e.accuracy;
    L.marker(e.latlng).addTo(map);
    L.circle(e.latlng, radius).addTo(map);

});

// Scan map when map is moved
map.on('moveend', function (e){
    scanMap(map.getBounds());
});



function scanMap(bounds) {    
    // If not processing bounds, execute fetch on these bounds
    if (!processingBounds) {
        // Set status of processingBounds to true
        processingBounds=true;

        // Get the bounds from the from the pending bounds
        const southWest = bounds.getSouthWest();
        const northEast = bounds.getNorthEast();

        // Create a green rectangle of the processing area
        const rectangle = L.rectangle([
            [southWest.lat, southWest.lng],
            [northEast.lat, northEast.lng]
        ], {
            fillColor: 'green',
            fillOpacity: 0.2
        }).addTo(map);   

        // Add a text in the middle
        const text = L.divIcon({
            className: 'text-label',
            html: 'Skannar sektion',
            iconAnchor: [100, 0]
        });
        const textMarker= L.marker([(southWest.lat + northEast.lat) / 2, (southWest.lng + northEast.lng) / 2], { icon: text }).addTo(map);
  

        // Fetch data (routes) from overpass
        fetch('https://overpass.kumi.systems/api/interpreter', {
            method: 'POST',
            body: `[out:json][timeout:10];(relation["type"="route"]["route"="hiking"](${southWest.lat}, ${southWest.lng}, ${northEast.lat}, ${northEast.lng}););out body;>;out skel qt;`
        })
            .then(response => response.json())
            .then(data => {

                // Extract relations,ways and nodes
                const relations = data.elements.filter(element => element.type === 'relation');
                const ways = data.elements.filter(element => element.type === 'way');
                const nodes = data.elements.filter(element => element.type === 'node');
                
                // Loop each relation (route)
                relations.forEach(relation => {
                    // Route already in our list, skip
                    if (routes[relation.id]) return;

                    // Create route instance
                    newRoute = new Route(relation);

                    // Loop all the members (ways) of the relation
                    relation.members.forEach(member => {
                        const way = ways.find(way => way.id === member.ref);
                        if (way) {
                            way["coordinates"] = [];
                            // Loop all the nodes in the way
                            way.nodes.forEach(nodeID => {
                                const node = nodes.find(node => node.id === nodeID);
                                // Push the node coordinates into the way coordinates array
                                way["coordinates"].push([node.lat, node.lon]);
                            }); 
                            // Add all the way coordinates into the created route
                            newRoute.addWay(way);
                        }  
                    });
                    // Add the created route to our list of routes
                    routes[relation.id]= newRoute;

                    // Add the route to the map
                    newRoute.addToMap(map);
            });
        }).catch(error => {
            console.error("Error fetching data:", error);
        }).finally(() => {
            // Remove scaning graphics
            rectangle.remove();
            textMarker.remove();

            // Set processing variable to false
            processingBounds = false;

            // If there is pending bounds, execute them
            if (pendingBounds) {
                scanMap(pendingBounds)
                pendingBounds= null;
            };
        });
        
 
    } else {
        // Already processing some bounds, set these to pending to be executed after current processed bounds
        pendingBounds = bounds;
    }


}


// Function to open modal and post weather-data
function showRouteInfo(route) {
    // Get title element 
    const modalTitle =  modal.querySelector(".modal-title");

    // Get table body
    const modalBody =  modal.querySelector(".modal-table tbody");

    // Set the title of the modal to the route title
    modalTitle.innerHTML = route.name;

    // Clear the table body
    modalBody.innerHTML = "";

    // Show modal
    modal.style.display = "block"; // Show modal

    // Fetch weather data from SMHI using the position of the route
    fetch(`https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/${route.position[1].toFixed(4)}/lat/${route.position[0].toFixed(4)}/data.json`)
        .then(response => response.json())
        .then(data => {
            // Extract all time steps
            var timeSeries = data.timeSeries;

            // Create an object to organize the data by date
            var dailyData = {};

            // Extract the data and organize it by date and time
            for (var i = 0; i < timeSeries.length; i++) {
                var time = new Date(timeSeries[i].validTime);
                var date = time.toISOString().split('T')[0];
                var hour = time.getHours();
                    if (!dailyData[date]) {
                        dailyData[date] = {};
                    }
                    dailyData[date][hour] = {
                        temperature: timeSeries[i].parameters.find(function (param) {
                            return param.name === "t";
                        }).values[0],
                        weatherSymbol: timeSeries[i].parameters.find(function (param) {
                            return param.name === "Wsymb2";
                        }).values[0]
                    };
                
            }


            for (var date in dailyData) {
                var row = document.createElement("tr");
                row.innerHTML = "<td>" + date + "</td>";
                var times = [1, 7, 13, 19];
                for (var i = 0; i < times.length; i++) {
                    var hourData = dailyData[date][times[i]];
                    var cell = document.createElement("td");
                    if (hourData) {
                        cell.innerHTML = Math.round(hourData.temperature) + "° <img src='./symbols/" + hourData.weatherSymbol + ".png' width='32px'>";
                    } 
                    row.appendChild(cell);
                }
                modalBody.appendChild(row);
            }
        })
        .catch(error => {
            console.error("Error fetching data: " + error);
        });



}



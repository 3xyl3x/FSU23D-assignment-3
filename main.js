var map = L.map('map').fitWorld();
var pendingQuery = null;
var processingQuery = null;
var routes={};
let drawnRelations = [];
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom:19,
    minZoom:11,
    attribution: '© OpenStreetMap'
}).addTo(map);


// Default location (Örebro)
map.setView([59.28, 15.229], 12);

// Locate the user
map.locate({setView: true});

// When user is located, add marker
map.on('locationfound', function(e){
    console.log("User located.")
    var radius = e.accuracy;
    L.marker(e.latlng).addTo(map);
    L.circle(e.latlng, radius).addTo(map);
    createPendingQuery();
});
map.on('locationerror', function(e) {
    console.log("User not located.");
    createPendingQuery();
  });

map.on('moveend', function (e){
    createPendingQuery();
});



function processPendingQuery() {
  if (pendingQuery!=null) {
    if (processingQuery===null) {
        console.log("Fetching map data")
        processingQuery=pendingQuery;
        pendingQuery = null;
        fetch('https://overpass.kumi.systems/api/interpreter', {
            method: 'POST',
            body: processingQuery
        })
            .then(response => response.json())
            .then(data => {
                console.log("Data fetched");
                processingQuery = null;

                const relations = data.elements.filter(element => element.type === 'relation');
                const ways = data.elements.filter(element => element.type === 'way');
                const nodes = data.elements.filter(element => element.type === 'node');
                

                relations.forEach(relation => {
                    if (routes[relation.id]) return;
                    newRoute = new Route(relation);
                    relation.members.forEach(member => {
                        const way = ways.find(way => way.id === member.ref);
                        if (way) {
                            way["coordinates"] = [];
                            way.nodes.forEach(nodeID => {
                                const node = nodes.find(node => node.id === nodeID);
                                way["coordinates"].push([node.lat, node.lon]);
                            }); 
                            newRoute.addWay(way);
                    }
                       
                    });
          
                    routes[relation.id]= newRoute;
                    newRoute.addToMap(map);

                           

            });
        }).catch(error => {
            console.error("Error fetching data:", error);
            processingQuery = null;
        });;
        
 
}}}

// Call the function every 10 seconds to make sure to deal with pending requests
setInterval(processPendingQuery, 10000);


function createPendingQuery(){
    var bounds = map.getBounds();
    var southWest = bounds.getSouthWest();
    var northEast = bounds.getNorthEast();
     pendingQuery = `[out:json];
    (
      relation["type"="route"]["route"="hiking"](${southWest.lat}, ${southWest.lng}, ${northEast.lat}, ${northEast.lng});
    );
    out body;
    >;
out skel qt;`;
processPendingQuery();
}


function showRouteInfo(route) {
    console.log(route);
    var modal = document.getElementById("myModal");
    modal.style.display = "block";
}



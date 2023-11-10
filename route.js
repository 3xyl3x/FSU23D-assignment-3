class Route {
    constructor(relation) {
        this.name=relation.tags.name;
        this.id=relation.id;
        this.ways=[];
        this.marker = null;
        this.position=null;
        console.log(`Route ${this.name} added`);
    }

    addWay(way){
        // Route position is not set, use first coordinates in the way
        if (this.position===null) {
            this.position=way["coordinates"][0];
        }
        // Add way into the ways array
        this.ways.push(way);
    }

    // Function, Add route graphics to Map
    addToMap(map) {
        if (this.position!==null) {
        // Add a marker 
        this.marker= L.marker(this.position).addTo(map);
        // Add name to the marker when hoover
        this.marker.bindTooltip('Namn: ' + this.name ).openPopup();
        // When clicking, call the function that shows the modal
        this.marker.on('click', (e) => {
            showRouteInfo(this);
        });
    }

        // Generate a color (rgb) based on the ID
        const color = `rgb(${(this.id * 15) % 256}, ${(this.id * 31) % 256}, ${(this.id * 10) % 256})`;

        // Loop the ways
       this.ways.forEach(way => {
            // Add the way to the map
            const pathPolyline = L.polyline(way["coordinates"]).addTo(map);
            // Set color and thickness
            pathPolyline.setStyle({ color: color, weight: 4 });
    });
    
    }

}
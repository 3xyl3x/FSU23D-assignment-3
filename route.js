class Route {
    constructor(relation) {
        this.name=relation.tags.name;
        this.id=relation.id;
        this.ways=[];
        this.marker = null;
        console.log(`Route ${this.name} added`);
    }

    addWay(way){
        this.ways.push(way);
    }

    // Function, Add route graphics to Map
    addToMap(map) {
        // Add a marker 
        this.marker= L.marker([this.ways[0]["coordinates"][0][0], this.ways[0]["coordinates"][0][1]]).addTo(map);
        this.marker.bindTooltip('Namn: ' + this.name ).openPopup();
        this.marker.on('click', (e) => {
            showRouteInfo(this);
        });

        // Loop the ways
       this.ways.forEach(way => {
        // Draw the path with a random color based on the ID
        const pathPolyline = L.polyline(way["coordinates"]).addTo(map);
        const red = (this.id * 15) % 256;
        const green = (this.id * 31) % 256;
        const blue = (this.id * 10) % 256;
        const color = `rgb(${red}, ${green}, ${blue})`;
        pathPolyline.setStyle({ color: color, weight: 4 });
    });
    
    }

}
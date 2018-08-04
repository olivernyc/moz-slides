var map;
var currentNode = {};
var searchQuery = "";

const maps = [
  {
    divId: "map-div-1",
    jsonPaths: {
      active: "/nodes/active-jan-18.json",
      potential: "/nodes/potential-jan-18.json",
      links: "/nodes/links-jan-18.json"
    },
    sectors: [
      {
        lat: 40.711137,
        lng: -74.001122,
        r: 2,
        azimuth: 55,
        width: 90
      },
      {
        lat: 40.713991,
        lng: -73.929049,
        r: 2,
        azimuth: 180,
        width: 220
      }
    ]
  },
  {
    divId: "map-div-2",
    jsonPaths: {
      active: "/nodes/active.json",
      potential: "/nodes/potential.json",
      links: "/nodes/links.json"
    },
    sectors: [
      {
        lat: 40.711137,
        lng: -74.001122,
        r: 2,
        azimuth: 55,
        width: 90
      },
      {
        lat: 40.713991,
        lng: -73.929049,
        r: 2,
        azimuth: 180,
        width: 220
      },
      {
        lat: 40.685823,
        lng: -73.917272,
        r: 2,
        azimuth: 180,
        width: 360
      }
    ]
  }
];

const styles = [
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [
      {
        color: "#f5f5f5"
      }
    ]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#e4f6dd" }]
  },
  {
    elementType: "labels.icon",
    stylers: [
      {
        visibility: "off"
      }
    ]
  },
  {
    elementType: "labels.text.stroke",
    stylers: [
      {
        color: "#f5f5f5"
      }
    ]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [
      {
        color: "#ffffff"
      }
    ]
  },
  {
    featureType: "road",
    elementType: "labels.icon",
    stylers: [
      {
        visibility: "off"
      }
    ]
  },
  {
    featureType: "road.highway",
    stylers: [
      {
        visibility: "off"
      }
    ]
  },
  {
    featureType: "transit",
    stylers: [
      {
        visibility: "off"
      }
    ]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [
      {
        color: "#d9dde6"
      }
    ]
  }
  // {
  //   featureType: "water",
  //   elementType: "labels.text.fill",
  //   stylers: [
  //     {
  //       color: "#777777"
  //     }
  //   ]
  // }
];

const mapOptions = {
  center: { lat: 40.6981809, lng: -73.9595798 },
  zoom: 13,
  disableDefaultUI: false,
  zoomControl: false,
  scrollwheel: false,
  scrollwheel: false,
  fullscreenControl: false,
  gestureHandling: "greedy",
  mapTypeControl: false,
  backgroundColor: "none"
};

function initMap() {
  return maps.map(map => {
    return initMapWithData(map);
  });
}

function initMapWithData(map) {
  const { divId, jsonPaths, sectors } = map;
  var map = new google.maps.Map(document.getElementById(divId), mapOptions);

  // Set map style
  var styledMap = new google.maps.StyledMapType(styles, { name: "Styled Map" });
  map.mapTypes.set("map_style", styledMap);
  map.setMapTypeId("map_style");

  // Load data
  var activeNodesLayer = new google.maps.Data();
  activeNodesLayer.loadGeoJson(jsonPaths.active);
  var potentialNodesLayer = new google.maps.Data();
  potentialNodesLayer.loadGeoJson(jsonPaths.potential);
  var linksLayer = new google.maps.Data();
  linksLayer.loadGeoJson(jsonPaths.links);

  // Draw sectors
  if (sectors) {
    sectors.forEach(sector => {
      drawSector(
        map,
        sector.lat,
        sector.lng,
        sector.r,
        sector.azimuth,
        sector.width
      );
    });
  }

  // Set layer styles
  activeNodesLayer.setStyle(function(feature) {
    var url = "/img/map/active.svg";
    var opacity = 1;
    var visible = true;
    var rotation = 0;
    var notes = feature.getProperty("notes").toLowerCase();
    if (notes.indexOf("supernode") !== -1) {
      url = "/img/map/supernode.svg";
    }

    return {
      title: feature.getProperty("id"),
      opacity: opacity,
      zIndex: 200,
      visible: visible,
      icon: {
        url: url,
        anchor: new google.maps.Point(10, 10),
        labelOrigin: new google.maps.Point(28, 10),
        rotation: rotation,
        scale: 0.5
      }
    };
  });

  potentialNodesLayer.setStyle(function(feature) {
    var url = "/img/map/potential.svg";
    var opacity = 1;
    var visible = true;
    var notes = feature.getProperty("notes").toLowerCase();
    if (notes.indexOf("supernode") !== -1) {
      url = "/img/map/supernode-potential.svg";
    }

    return {
      title: feature.getProperty("id"),
      opacity: opacity,
      zIndex: 100,
      visible: visible,
      icon: {
        url: url,
        anchor: new google.maps.Point(10, 10),
        labelOrigin: new google.maps.Point(28, 10)
      }
    };
  });

  linksLayer.setStyle(function(link) {
    var strokeColor = "#ff3b30";
    var opacity = 0.5;
    var visible = true;
    if (link.getProperty("status") != "active") {
      strokeColor = "gray";
      opacity = 0;
    }

    if (searchQuery.length > 0) {
      var linkMatches =
        matchesSearch(searchQuery, link.getProperty("from")) ||
        matchesSearch(searchQuery, link.getProperty("to"));
      if (!linkMatches) visible = false;
    }

    return {
      visible: visible,
      zIndex: 999,
      strokeWeight: 3,
      strokeColor: strokeColor,
      strokeOpacity: opacity
    };
  });

  // Add layers to map
  linksLayer.setMap(map);
  // potentialNodesLayer.setMap(map);
  activeNodesLayer.setMap(map);
}

function drawSector(map, lat, lng, r, azimuth, width, color) {
  var centerPoint = new google.maps.LatLng(lat, lng);
  var PRlat = r / 3963 * (180 / Math.PI); // using 3963 miles as earth's radius
  var PRlng = PRlat / Math.cos(lat * (Math.PI / 180));
  var PGpoints = [];
  PGpoints.push(centerPoint);

  with (Math) {
    lat1 = lat + PRlat * cos(Math.PI / 180 * (azimuth - width / 2));
    lon1 = lng + PRlng * sin(Math.PI / 180 * (azimuth - width / 2));
    PGpoints.push(new google.maps.LatLng(lat1, lon1));

    lat2 = lat + PRlat * cos(Math.PI / 180 * (azimuth + width / 2));
    lon2 = lng + PRlng * sin(Math.PI / 180 * (azimuth + width / 2));

    var theta = 0;
    var gamma = Math.PI / 180 * (azimuth + width / 2);

    for (var a = 1; theta < gamma; a++) {
      theta = Math.PI / 180 * (azimuth - width / 2 + a);
      PGlon = lng + PRlng * sin(theta);
      PGlat = lat + PRlat * cos(theta);

      PGpoints.push(new google.maps.LatLng(PGlat, PGlon));
    }

    PGpoints.push(new google.maps.LatLng(lat2, lon2));
    PGpoints.push(centerPoint);
  }

  var poly = new google.maps.Polygon({
    path: PGpoints,
    strokeColor: "transparent",
    strokeOpacity: 0,
    strokeWidth: 0,
    fillColor: "#007aff",
    fillOpacity: 0.125,
    map: map
  });

  poly.setMap(map);
  return poly;
}

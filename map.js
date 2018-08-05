var map;
var currentNode = {};
var searchQuery = "";

const mapOptions = {
  center: { lat: 40.6991809, lng: -73.9505798 },
  zoom: 13,
  disableDefaultUI: false,
  zoomControl: false,
  streetViewControl: false,
  scrollwheel: false,
  scrollwheel: false,
  fullscreenControl: false,
  gestureHandling: "greedy",
  mapTypeControl: false,
  backgroundColor: "none"
};

const maps = [
  {
    divId: "map-div-1",
    jsonPaths: {
      active: "/nodes/active-jan-18.json",
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
  },
  {
    divId: "map-div-3",
    jsonPaths: {
      active: "/nodes/active-new-18.json",
      links: "/nodes/links-new-18.json"
    },
    sectors: [
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
];

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
    const install_year = feature.getProperty("install_year");
    var opacity = install_year ? (install_year == 2018 ? 1 : 0.25) : 1;
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
        scale: 0.5
      }
    };
  });

  linksLayer.setStyle(function(link) {
    var strokeColor = "#ff3b30";

    const install_year = link.getProperty("install_year");
    var opacity = install_year ? (install_year == 2018 ? 1 : 0.25) : 1;

    if (link.getProperty("status") != "active") {
      strokeColor = "gray";
      opacity = 0;
    }

    return {
      zIndex: 999,
      strokeWeight: 3,
      strokeColor: strokeColor,
      strokeOpacity: opacity
    };
  });

  // Add layers to map
  linksLayer.setMap(map);
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

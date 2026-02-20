const directionsStyle = [{
    'id': 'directions-route-line-alt',
    'type': 'line',
    'source': 'directions',
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#a8a8a8', 
      'line-width': 5
    },
    'filter': [
      'all',
      ['in', '$type', 'LineString'],
      ['in', 'route', 'alternate']
    ]
  }, {
    'id': 'directions-route-line-casing',
    'type': 'line',
    'source': 'directions',
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#3e84ff', 
      'line-width': 14
    },
    'filter': [
      'all',
      ['in', '$type', 'LineString'],
      ['in', 'route', 'selected']
    ]
  }, {
    'id': 'directions-route-line',
    'type': 'line',
    'source': 'directions',
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': {
        'property': 'congestion',
        'type': 'categorical',
        'default': '#1f78d1', 
        'stops': [
          ['unknown', '#1f78d1'],
          ['low', '#1f78d1'],
          ['moderate', '#fbb040'], 
          ['heavy', '#ff5733'], 
          ['severe', '#8b2342'] 
        ]
      },
      'line-width': 6
    },
    'filter': [
      'all',
      ['in', '$type', 'LineString'],
      ['in', 'route', 'selected']
    ]
  }, {
    'id': 'directions-hover-point-casing',
    'type': 'circle',
    'source': 'directions:markers',
    'paint': {
      'circle-radius': 9,
      'circle-color': '#ffffff'
    },
    'filter': [
      'all',
      ['in', '$type', 'Point'],
      ['in', 'id', 'hover']
    ]
  }, {
    'id': 'directions-hover-point',
    'type': 'circle',
    'source': 'directions:markers',
    'paint': {
      'circle-radius': 7,
      'circle-color': '#ffd700'
    },
    'filter': [
      'all',
      ['in', '$type', 'Point'],
      ['in', 'id', 'hover']
    ]
  }, {
    'id': 'directions-waypoint-point-casing',
    'type': 'circle',
    'source': 'directions:markers',
    'paint': {
      'circle-radius': 9,
      'circle-color': '#ffffff'
    },
    'filter': [
      'all',
      ['in', '$type', 'Point'],
      ['in', 'id', 'waypoint']
    ]
  }, {
    'id': 'directions-waypoint-point',
    'type': 'circle',
    'source': 'directions:markers',
    'paint': {
      'circle-radius': 7,
      'circle-color': '#00c853'
    },
    'filter': [
      'all',
      ['in', '$type', 'Point'],
      ['in', 'id', 'waypoint']
    ]
  }, {
    'id': 'directions-origin-point',
    'type': 'circle',
    'source': 'directions:markers',
    'paint': {
      'circle-radius': 18,
      'circle-color': '#ff4081'
    },
    'filter': [
      'all',
      ['in', '$type', 'Point'],
      ['in', 'marker-symbol', 'A']
    ]
  }, {
    'id': 'directions-origin-label',
    'type': 'symbol',
    'source': 'directions:markers',
    'layout': {
      'text-field': 'A',
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'text-size': 12
    },
    'paint': {
      'text-color': '#ffffff'
    },
    'filter': [
      'all',
      ['in', '$type', 'Point'],
      ['in', 'marker-symbol', 'A']
    ]
  }, {
    'id': 'directions-destination-point',
    'type': 'circle',
    'source': 'directions:markers',
    'paint': {
      'circle-radius': 18,
      'circle-color': '#00bcd4' 
    },
    'filter': [
      'all',
      ['in', '$type', 'Point'],
      ['in', 'marker-symbol', 'B']
    ]
  }, {
    'id': 'directions-destination-label',
    'type': 'symbol',
    'source': 'directions:markers',
    'layout': {
      'text-field': 'B',
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'text-size': 12
    },
    'paint': {
      'text-color': '#ffffff'
    },
    'filter': [
      'all',
      ['in', '$type', 'Point'],
      ['in', 'marker-symbol', 'B']
    ]
}];
  
export default directionsStyle;
  
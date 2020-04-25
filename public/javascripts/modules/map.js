import axios from 'axios'
import { $ } from './bling'

const mapOptions = {
  center: { lat: 43.2, lng: -79.8 },
  zoom: 12
}

function loadPlaces(map, lat = 43.2, lng = -79.8) {
  axios.get(`/api/stores/near?lat=${lat}&lng=${lng}`)
    .then(res => {
      const places = res.data
      if (places.length) {
        const bounds = new google.maps.LatLngBounds()
        const infoWindow = new google.maps.InfoWindow()

        const markers = places.map(place => {
          const [placeLng, placeLat] = place.location.coordinates
          const position = { lat: placeLat, lng: placeLng }
          bounds.extend(position)
          const marker = new google.maps.Marker({ map, position })
          marker.addListener('click', function() {
            const p = this.place
            const html = `
              <div class="popup">
                <a href="/store/${p.slug}">
                  <img src="/uploads/${p.photo || 'store.png'}" alt="${p.name}"/>
                  <p>${p.name} - ${p.location.address}</p>
                </a>
              </div>
            `
            infoWindow.setContent(html)
            infoWindow.open(map, this)
          })
          marker.place = place
          return marker
        })
        
        // Then zoom the map to fit the markers perfectly
        map.setCenter(bounds.getCenter())
        map.fitBounds(bounds)
        
      } else {
        alert('No places found!')
      }
    })
}

function makeMap(mapDiv) {
  if (!mapDiv) return

  // Make our map
  const map = new google.maps.Map(mapDiv, mapOptions)
  loadPlaces(map)

  const input = $('[name="geolocate"]')
  const autocomplete = new google.maps.places.Autocomplete(input)
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace()
    const location = place.geometry.location
    loadPlaces(map, location.lat(), location.lng())
    
  })
}

export default makeMap
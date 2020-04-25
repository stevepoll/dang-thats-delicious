import { $, $$ } from './bling'

import axios from 'axios'
import dompurify from 'dompurify'

function searchResultsHtml(stores) {
  return stores.map(store => {
    return `
      <a href="/store/${store.slug}" class="search__result">
        <strong>${store.name}</strong>
      </a>
    `
  }).join('')
}

function typeAhead(search) {
  if (!search) return

  const searchInput = $('input.search__input')
  const searchResults = $('.search__results')

  searchInput.on('input', function() {
    // If there is no value, quit
    if (!this.value) {
      searchResults.style.display = 'none'
      return
    }
    
    // Show search results
    searchResults.style.display = 'block'
    
    axios
      .get(`/api/search?q=${this.value}`)
      .then(res => {
        if (res.data.length) {
          searchResults.innerHTML = dompurify.sanitize(searchResultsHtml(res.data))
          return
        }
        // Tell them nothing came back
        searchResults.innerHTML = dompurify
          .sanitize(`<div class="search__result">No results for ${this.value} found</div>`)
        
      })
      .catch(err => {
        console.error(err)
      })
  })

  searchInput.on('keyup', (e) => {
    // up, down, and enter keys are keyCode 38, 40, and 13
    if ([38, 40, 13].includes(e.keyCode)) {
      const active = 'search__result--active'
      const current = $('.' + active)
      const items = $$('.search__result')
      let next

      if (current) {
        if (e.keyCode === 40) {
          next = current.nextElementSibling || items[0]
        } else if (e.keyCode === 38) {
          next = current.previousElementSibling || items[items.length - 1]
        } else if (e.keyCode === 13) {
          window.location = current
          return
        }
      } else {
        if (e.keyCode === 40) {
          next = items[0]
        } else if (e.keyCode ===38) {
          next = items[items.length - 1]
        }
      }

      current && current.classList.remove(active)
      next.classList.add(active)
    }
  })
}

export default typeAhead
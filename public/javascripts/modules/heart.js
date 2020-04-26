import axios from 'axios'

function ajaxHeart(e) {
  e.preventDefault()
  const d = document
  
  axios
    .post(this.action)
    .then(res => {
      d.querySelector('.heart-count').textContent = res.data.hearts.length
      const isHearted = this.heart.classList.toggle('heart__button--hearted')
      if (isHearted) {
        this.heart.classList.add('heart__button--float')
        setTimeout(() => this.heart.classList.remove('heart__button--float'), 2500)
      }
    })
    .catch(console.error)
}

export default ajaxHeart
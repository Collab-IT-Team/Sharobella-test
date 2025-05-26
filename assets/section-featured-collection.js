document.addEventListener("DOMContentLoaded", () => {
  class FeaturedCollectionSlider extends HTMLElement {
    connectedCallback() {
      const sliderElement = this;
      const productsToShow = parseFloat(this.dataset.productsToShow) || 4.5;

      const slideItems = sliderElement.querySelectorAll(".swiper-slide");
      const totalSlides = slideItems.length;

      const shouldLoop = totalSlides > Math.ceil(productsToShow);

      if (!sliderElement.swiper) {
        const swiper = new Swiper(sliderElement, {
          loop: shouldLoop,
          speed: 700,
          navigation: {
            nextEl: sliderElement.querySelector(".swiper-button-next"),
            prevEl: sliderElement.querySelector(".swiper-button-prev"),
          },
          pagination: {
            el: sliderElement.nextElementSibling,
            clickable: true,
          },
          breakpoints: {
            320: {
              slidesPerView: 1.55,
            },
            640: {
              slidesPerView: 2.5,
            },
            1024: {
              slidesPerView: 3.4,
            },
            1300: {
              slidesPerView: productsToShow,
            },
          },
        });
      }
    }
  }

  if (!customElements.get("featured-collection-slider")) {
    customElements.define(
      "featured-collection-slider",
      FeaturedCollectionSlider
    );
  }
});

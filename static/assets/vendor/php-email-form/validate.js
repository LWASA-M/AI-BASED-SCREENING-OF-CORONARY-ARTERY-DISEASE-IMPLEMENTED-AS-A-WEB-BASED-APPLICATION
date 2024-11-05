(function () {
  "use strict";

  let forms = document.querySelectorAll('.php-email-form');

  forms.forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();

      let thisForm = this;
      let action = thisForm.getAttribute('action');

      if (!action) {
        console.error('The form action property is not set!');
        return;
      }

      let loadingElement = thisForm.querySelector('.loading');
      if (loadingElement) {
        loadingElement.classList.add('d-block');
      } else {
        console.error('Loading element not found.');
      }

      let errorMessageElement = thisForm.querySelector('.error-message');
      if (errorMessageElement) {
        errorMessageElement.classList.remove('d-block');
      }

      let sentMessageElement = thisForm.querySelector('.sent-message');
      if (sentMessageElement) {
        sentMessageElement.classList.remove('d-block');
      }

      let formData = new FormData(thisForm);

      // Include CSRF token in the request headers
      const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

      fetch(action, {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRFToken': csrfToken
        }
      })
        .then(response => {
          console.log('Response status:', response.status);
          if (response.ok) {
            return response.json(); // Parse response as JSON
          } else {
            throw new Error(`${response.status} ${response.statusText}`);
          }
        })
        .then(data => {
          console.log('Server response:', data);
          if (loadingElement) {
            loadingElement.classList.remove('d-block');
          }

          let resultContainer = document.querySelector('.result-container');
          resultContainer.innerHTML = ''; // Clear previous content

          if (data.shap_plot_path) {
            resultContainer.innerHTML += `<div><img src="${data.shap_plot_path}" alt="SHAP Plot"></div>`;
          }

          if (data.histogram_plot_path) {
            resultContainer.innerHTML += `<div><img src="${data.histogram_plot_path}" alt="Histogram"></div>`;
          }

          if (data.recommendations && data.recommendations.length > 0) {
            resultContainer.innerHTML += `<div><h3>Recommendations:</h3><ul>`;
            data.recommendations.forEach(recommendation => {
              resultContainer.innerHTML += `<li>${recommendation}</li>`;
            });
            resultContainer.innerHTML += `</ul></div>`;
          }

          // Ensure success message is not shown
          if (sentMessageElement) {
            sentMessageElement.classList.remove('d-block');
          }
        })
        .catch(error => {
          console.error('Submission error:', error);
          if (loadingElement) {
            loadingElement.classList.remove('d-block');
          }
          if (errorMessageElement) {
            let errorMessage = error.message || 'Oops! Something went wrong.';
            errorMessageElement.innerHTML = errorMessage;
            errorMessageElement.classList.add('d-block');
          }
        });
    });
  });

})();

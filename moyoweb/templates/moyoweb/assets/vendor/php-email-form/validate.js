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

      thisForm.querySelector('.loading').classList.add('d-block');
      thisForm.querySelector('.error-message').classList.remove('d-block');
      thisForm.querySelector('.sent-message').classList.remove('d-block');

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
        thisForm.querySelector('.loading').classList.remove('d-block');

        // Clear previous content
        let resultContainer = document.querySelector('.result-container');
        resultContainer.innerHTML = '';

        // Display result
        if (data.result) {
          let resultElement = document.createElement('div');
          resultElement.innerHTML = `<p>${data.result}</p>`;
          resultContainer.appendChild(resultElement);
        }

        // Display feature importance plot
        if (data.feature_importance_plot_path) {
          let featureImportancePlotElement = document.createElement('div');
          featureImportancePlotElement.innerHTML = `<div><img src="${data.feature_importance_plot_path}" alt="Feature Importance Plot"></div>`;
          resultContainer.appendChild(featureImportancePlotElement);
        }

        // Display recommendations
        if (data.recommendations && data.recommendations.length > 0) {
          let recommendationsElement = document.createElement('div');
          let recommendationsHTML = `<div><h3>Recommendations:</h3><ul>`;
          data.recommendations.forEach(recommendation => {
            recommendationsHTML += `<li>${recommendation}</li>`;
          });
          recommendationsHTML += `</ul></div>`;
          recommendationsElement.innerHTML = recommendationsHTML;
          resultContainer.appendChild(recommendationsElement);
        }

        // Ensure success message is not shown
        thisForm.querySelector('.sent-message').classList.remove('d-block');
      })
      .catch(error => {
        console.error('Submission error:', error);
        thisForm.querySelector('.loading').classList.remove('d-block');
        let errorMessage = error.message || 'Oops! Something went wrong.';
        thisForm.querySelector('.error-message').innerHTML = errorMessage;
        thisForm.querySelector('.error-message').classList.add('d-block');
      });
    });

    // Show summary modal functionality
    const summaryModal = document.getElementById('summaryModal');
    const summaryContent = document.getElementById('summaryContent');
    const submitBtn = document.getElementById('submitBtn');
    const closeBtn = document.querySelector('.close');

    submitBtn.addEventListener('click', function () {
      const formData = new FormData(form);
      let summaryHTML = '<ul>';
      formData.forEach((value, key) => {
        summaryHTML += `<li><strong>${key}:</strong> ${value}</li>`;
      });
      summaryHTML += '</ul>';
      summaryContent.innerHTML = summaryHTML;
      summaryModal.style.display = 'block';
    });

    closeBtn.addEventListener('click', function () {
      summaryModal.style.display = 'none';
    });

    window.addEventListener('click', function (event) {
      if (event.target === summaryModal) {
        summaryModal.style.display = 'none';
      }
    });

    // Final form submission confirmation
    const confirmSubmit = document.getElementById('confirmSubmit');
    confirmSubmit.addEventListener('click', function () {
      summaryModal.style.display = 'none'; // Close the modal

      // Trigger AJAX form submission
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    });

    // Add BMI calculation functionality
    const weightInput = document.getElementById('weight');
    const heightInput = document.getElementById('height');
    const bmiResult = document.getElementById('bmi-result');

    function calculateBMI() {
      const weight = parseFloat(weightInput.value);
      const height = parseFloat(heightInput.value) / 100; // Convert height to meters

      if (!isNaN(weight) && !isNaN(height) && height > 0) {
        const bmi = (weight / (height * height)).toFixed(2);
        let status = '';

        if (bmi >= 30) {
          status = 'Obese';
        } else {
          status = 'Not Obese';
        }

        bmiResult.innerHTML = `
          <div class="alert alert-info">
            <strong>BMI:</strong> ${bmi}<br>
            <strong>Status:</strong> ${status}
          </div>
        `;
      } else {
        bmiResult.innerHTML = '';
      }
    }

    weightInput.addEventListener('input', calculateBMI);
    heightInput.addEventListener('input', calculateBMI);

    // Add Blood Pressure calculation functionality
    const sbpInput = document.getElementById('sbp');
    const dbpInput = document.getElementById('dbp');
    const bpResult = document.getElementById('bp-result');

    function calculateBloodPressure() {
      const sbp = parseFloat(sbpInput.value);
      const dbp = parseFloat(dbpInput.value);

      if (!isNaN(sbp) && !isNaN(dbp)) {
        if (sbp >= 140 || dbp >= 90) {
          bpResult.innerHTML = `
            <div class="alert alert-danger">
              <strong>Hypertensive:</strong> The patient is hypertensive.
            </div>
          `;
        } else {
          bpResult.innerHTML = `
            <div class="alert alert-success">
              <strong>Normal:</strong> The patient's blood pressure is normal.
            </div>
          `;
        }
      } else {
        bpResult.innerHTML = '';
      }
    }

    sbpInput.addEventListener('input', calculateBloodPressure);
    dbpInput.addEventListener('input', calculateBloodPressure);

  });
})();


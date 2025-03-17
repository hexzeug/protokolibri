// # Color theme
const colorThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
const updateColorTheme = () =>
  document.documentElement.setAttribute(
    'data-bs-theme',
    colorThemeMediaQuery.matches ? 'dark' : 'light'
  );
colorThemeMediaQuery.addEventListener('change', updateColorTheme);
updateColorTheme();

window.addEventListener(
  'DOMContentLoaded',
  () => {
    // # Form validation
    const newPassword = document.querySelector('#newPassword');
    const repeatPassword = document.querySelector('#repeatPassword');
    const checkRepeatedPassword = () => {
      repeatPassword.setCustomValidity(
        newPassword.value === repeatPassword.value ? '' : 'differentPassword'
      );
      repeatPassword.dispatchEvent(new Event('validate.form'));
    };
    newPassword.addEventListener('change', checkRepeatedPassword);
    repeatPassword.addEventListener('change', checkRepeatedPassword);
    checkRepeatedPassword();

    const startDate = document.querySelector('#startDate');
    const startTime = document.querySelector('#startTime');
    const endDate = document.querySelector('#endDate');
    const endTime = document.querySelector('#endTime');
    const checkDatetimeInterval = () => {
      const startD = Date.parse(startDate.value);
      const endD = Date.parse(endDate.value);
      const start = Date.parse(`${startDate.value}T${startTime.value}Z`);
      const end = Date.parse(`${endDate.value}T${endTime.value}Z`);
      endDate.setCustomValidity(startD <= endD ? '' : 'negativePeriod');
      endTime.setCustomValidity(start < end ? '' : 'negativePeriod');
      endDate.dispatchEvent(new Event('validate.form'));
      endTime.dispatchEvent(new Event('validate.form'));
    };
    startDate.addEventListener('change', checkDatetimeInterval);
    startTime.addEventListener('change', checkDatetimeInterval);
    endDate.addEventListener('change', checkDatetimeInterval);
    endTime.addEventListener('change', checkDatetimeInterval);
    checkDatetimeInterval();

    document.querySelectorAll('.needs-validation').forEach((form) => {
      form.addEventListener(
        'submit',
        (event) => {
          if (!form.checkValidity()) {
            event.preventDefault();
            event.stopImmediatePropagation();
          }
          if (!form.classList.contains('was-validated')) {
            form.classList.add('was-validated');

            // support for input groups with floating labels
            form
              .querySelectorAll('.has-validation > .form-floating')
              .forEach((root) => {
                const validate = () => {
                  const valid = root.querySelector(':invalid') === null;
                  root.classList.toggle('is-valid', valid);
                  root.classList.toggle('is-invalid', !valid);
                };
                root
                  .querySelectorAll(
                    '& > .form-control, & > .form-select, & > .form-check'
                  )
                  .forEach((control) => {
                    control.addEventListener('change', validate);
                    control.addEventListener('validate.form', validate);
                  });
                validate();
              });
          }
        },
        false
      );
    });

    // reset modal forms
    document.querySelectorAll('.modal').forEach((modal) => {
      const forms = modal.querySelectorAll('form.modal-close-reset');
      if (forms.length === 0) return;
      modal.addEventListener('hidden.bs.modal', () => {
        forms.forEach((form) => form.reset());
      });
    });

    // select all
    const deviceSelection = document.querySelector('#deviceSelection');
    const deviceSelectors = Array.from(deviceSelection.elements);
    const allDevices = document.querySelector('#allDevices');
    const updateAllDevices = () => {
      const selected = deviceSelectors
        .filter((elm) => elm.type === 'checkbox')
        .map((checkbox) => checkbox.checked);
      if (!selected.includes(true)) {
        allDevices.checked = false;
        allDevices.indeterminate = false;
      } else if (!selected.includes(false)) {
        allDevices.checked = true;
        allDevices.indeterminate = false;
      } else {
        allDevices.checked = false;
        allDevices.indeterminate = true;
      }
    };
    deviceSelectors.forEach((checkbox) => {
      checkbox.addEventListener('change', updateAllDevices);
    });
    allDevices.addEventListener('change', () => {
      if (allDevices.indeterminate) return;
      deviceSelectors.forEach(
        (checkbox) => (checkbox.checked = allDevices.checked)
      );
    });
    updateAllDevices();
  },
  false
);

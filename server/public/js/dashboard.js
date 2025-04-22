'use strict';

const FEATURE_DELETE_CODE_ON_CLOSE = false;

window.addEventListener(
  'DOMContentLoaded',
  () => {
    const API = document.documentElement.getAttribute('data-api');

    // # Color theme
    const colorThemeMediaQuery = window.matchMedia(
      '(prefers-color-scheme: dark)'
    );
    const updateColorTheme = () =>
      document.documentElement.setAttribute(
        'data-bs-theme',
        colorThemeMediaQuery.matches ? 'dark' : 'light'
      );
    colorThemeMediaQuery.addEventListener('change', updateColorTheme);
    updateColorTheme();

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
    const updateDeviceSelectionInputs = () => {
      const data = new FormData(document.querySelector('#deviceSelection'))
        .getAll('devices')
        .join(',');
      document.querySelectorAll('[data-device-selection]').forEach((input) => {
        input.value = data;
      });
    };
    deviceSelectors.forEach((checkbox) => {
      checkbox.addEventListener('change', updateAllDevices);
      checkbox.addEventListener('change', updateDeviceSelectionInputs);
    });
    allDevices.addEventListener('change', () => {
      if (allDevices.indeterminate) return;
      deviceSelectors.forEach(
        (checkbox) => (checkbox.checked = allDevices.checked)
      );
    });
    allDevices.addEventListener('change', updateDeviceSelectionInputs);
    updateAllDevices();
    updateDeviceSelectionInputs();

    // pairing
    const pairing = document.querySelector('#pairing');
    const pairingQR = document.querySelector('#pairingQR');
    const pairingURL = document.querySelector('#pairingURL');
    pairing.addEventListener('show.bs.offcanvas', async () => {
      const res = await fetch(`${API}/devices/code`);
      if (!res.ok) {
        console.error('Failed loading pairing code');
        return;
      }
      const code = await res.json();
      pairingQR.innerHTML = code.qr.svg;
      pairingURL.textContent = code.url;
      pairingQR.setAttribute('data-code', code.code);
    });
    pairing.addEventListener('hidden.bs.offcanvas', async () => {
      const code = pairingQR.getAttribute('data-code');
      pairingQR.innerHTML = '';
      pairingURL.textContent = '';
      pairingQR.removeAttribute('data-code');
      if (FEATURE_DELETE_CODE_ON_CLOSE) {
        await fetch(`${API}/devices/code?code=${code}`, {
          method: 'DELETE',
        });
      }
    });

    // device statuses
    const refreshDeviceStatuses = async () => {
      let res;
      try {
        res = await fetch(`${API}/devices`);
        if (!res.ok) {
          console.error('device statuses request failed: ', res);
          throw new Error();
        }
      } catch {
        document
          .querySelectorAll('[data-device-status]')
          .forEach((deviceStatus) => {
            deviceStatus.setAttribute('data-status', 'loading');
          });
        return;
      }

      const devices = await res.json();
      const dateFormatter = new Intl.DateTimeFormat(undefined, {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      devices.forEach((device) => {
        const deviceStatus = document.querySelector(
          `[data-device-status="${device.name}"]`
        );
        if (deviceStatus === null) return;

        if (device.lastOnline === null) {
          deviceStatus.setAttribute('data-status', 'never');
          return;
        }
        deviceStatus.setAttribute(
          'data-status',
          device.online ? 'online' : 'offline'
        );

        const deviceLastOnline = document.querySelector(
          `[data-device-last-online="${device.name}"]`
        );
        if (deviceLastOnline === null) return;

        const dateString = dateFormatter.format(device.lastOnline);
        if (deviceLastOnline.innerHTML !== dateString) {
          deviceLastOnline.innerHTML = dateString;
        }
      });
    };
    setInterval(refreshDeviceStatuses, 1000);
  },
  false
);

/**
 * Sunrise/sunset algorithm taken from https://gist.github.com/Tafkas/4742250
 */
const sunrise = (() => {
  function calculate(dayOfYear, latitude, longitude, timezoneHours, isSunset) {
    const zenith = 90.83333333333333;
    const D2R = Math.PI / 180;
    const R2D = 180 / Math.PI;

    const lnHour = longitude / 15;
    let t;
    if (isSunset) {
        t = dayOfYear + ((18 - lnHour) / 24);
    } else {
        t = dayOfYear + ((6 - lnHour) / 24);
    };

    const M = (0.9856 * t) - 3.289;

    let L = M + (1.916 * Math.sin(M * D2R)) + (0.020 * Math.sin(2 * M * D2R)) + 282.634;
    if (L > 360) {
        L = L - 360;
    } else if (L < 0) {
        L = L + 360;
    };

    let RA = R2D * Math.atan(0.91764 * Math.tan(L * D2R));
    if (RA > 360) {
        RA = RA - 360;
    } else if (RA < 0) {
        RA = RA + 360;
    };

    const Lquadrant = Math.floor(L / 90) * 90;
    const RAquadrant = Math.floor(RA / 90) * 90;
    RA = RA + (Lquadrant - RAquadrant);

    RA = RA / 15;

    const sinDec = 0.39782 * Math.sin(L * D2R);
    const cosDec = Math.cos(Math.asin(sinDec));

    const cosH =
        (Math.cos(zenith * D2R) - (sinDec * Math.sin(latitude * D2R)))
            / (cosDec * Math.cos(latitude * D2R));
    let H;
    if (isSunset) {
        H = 360 - R2D * Math.acos(cosH);
    } else {
        H = R2D * Math.acos(cosH);
    };
    H = H / 15;

    const T = H + RA - (0.06571 * t) - 6.622;

    let UT = T - lnHour;
    if (UT > 24) {
        UT = UT - 24;
    } else if (UT < 0) {
        UT = UT + 24;
    }

    const localT = UT + timezoneHours;

    return localT;
  }

  return (latitude, longitude, timezoneHours) => {
    const dateNow = new Date();
    const yearStart = new Date(dateNow.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((dateNow - yearStart) / (1000 * 60 * 60 * 24));

    return {
      sunrise: calculate(dayOfYear, latitude, longitude, timezoneHours, true),
      sunset: calculate(dayOfYear, latitude, longitude, timezoneHours, false),
    }
  };
})();
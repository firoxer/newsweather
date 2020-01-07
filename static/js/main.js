function init() {
  refreshNews();
  refreshWeather();

  const refreshInterval = 30 * 60 * 1000; // Half an hour
  setInterval(refreshNews, refreshInterval);
  setInterval(refreshWeather, refreshInterval);

  scrollToTopOnIdle();
}

window.onload = init;

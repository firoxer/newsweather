function scrollToTopOnIdle() {
  const TIMEOUT_MS = 60000;

  let timer;

  const startTimer = () => {
    timer = setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), TIMEOUT_MS);
  };

  const resetTimer = () => {
    clearTimeout(timer);
    startTimer();
  };

  document.addEventListener('mousemove', resetTimer);
  document.addEventListener('touchmove', resetTimer);
  document.addEventListener('touchstart', resetTimer);
  document.addEventListener('scroll', resetTimer);

  startTimer();
}

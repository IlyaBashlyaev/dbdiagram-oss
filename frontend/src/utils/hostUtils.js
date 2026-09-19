export const isFreeHostedOrigin = () => {
  const hostname = window.location.hostname;
  return /\.github\.io$/i.test(hostname) || /\.netlify\.app$/i.test(hostname);
};

import '../src/index.css';
import App from '../src/App';

export default function NextApp({ Component, pageProps }) {
  return (
    <App>
      <Component {...pageProps} />
    </App>
  );
}

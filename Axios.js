import { setupCache } from "axios-cache-interceptor";
import axios from "axios";

const api = setupCache(axios.create(), {
    ttl: 10 * 60 * 1000,
    interpretHeader: false
});

const Axios = api;

export default Axios;
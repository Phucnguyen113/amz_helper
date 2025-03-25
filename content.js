const div = document.createElement("div");
// div.innerHTML = `<div style="position: fixed; bottom: 10px; right: 10px; 
//                  background: #ffcc00; padding: 10px; z-index: 9999;">
//                   🛠️ Extension đang hoạt động!
//                  </div>`;

// document.body.appendChild(div);

import { createRoot } from "react-dom/client";
import React from "react";
import $ from "jquery";
import App from './App';
import { useChromeStorageLocal } from "use-chrome-storage";

const appEl = div
appEl.id = "the_p_h_b_s_id";
document.body.appendChild(appEl);
const appRoot = createRoot(appEl);
appRoot.render(<App />);

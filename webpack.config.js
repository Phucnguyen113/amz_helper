const path = require("path");

module.exports = {
  /* đây là file đầu tiên mà webpack sẽ đọc ở đây mình để index.js */ 
  entry: path.resolve(__dirname, "content.js"),
  /* cấu hình thư mục đầu ra là dist và tên file là index.bundle.js,
  clean dùng để reset thư mục dist khi build */
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "content.js",
    clean: true,
  },
  resolve: {
    extensions: [".ts", ".js", ".jsx"],
  },
  devtool: 'source-map',
  module: {
    rules: [
        {
            test: /\.(js|jsx)$/, // Hỗ trợ cả .js và .jsx
            exclude: /node_modules/, // Bỏ qua thư viện ngoài
            use: {
                loader: "babel-loader",
                options: {
                presets: ["@babel/preset-react"], // Hỗ trợ JSX
                },
            }
        },
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
    ]
}
};
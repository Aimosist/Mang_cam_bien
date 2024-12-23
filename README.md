﻿Đo nhiệt độ, độ ẩm, ánh sáng bằng ESP8266 gửi tin nhắn bằng MQTT qua Node.js để tạo data MySQL rồi hiển thị số đo, bảng và điều khiển LED trên Web 

Mô tả:

Bài tập này sử dụng ESP8266 để đo nhiệt độ, độ ẩm và cường độ ánh sáng, phát số liệu bằng tin nhắn qua Mosquitto MQTT cho Node.js xử lý, sau đó gửi dữ liệu lên MySQL.
 
Thiết bị cảm biến kết nối với ESP8266 sẽ liên tục thu thập dữ liệu và cập nhật dữ liệu để hiển thị các thông tin, bảng biểu kết hợp điều khiển Led của ESP8266 thông qua một web tạo ra từ Node.js.

Thành phần sử dụng:

* ESP8266: giao tiếp với cảm biến và gửi số liệu các cảm biến cho Mosquitto MQTT.
* Mosquitto MQTT: tạo tin nhắn để gửi cho Node.js từ số liệu các cảm biến, hỗ trợ giao tiếp qua MQTT.
* Node.js: xử lý tin nhắn MQTT thành dữ liệu nhiệt độ, độ ẩm, ánh sáng,... để lưu trữ trên MySQL; tạo web từ file "public" chứa các code html để hiển thị, vẽ bảng các data và điều khiển Led.
* MySQL: lưu trữ thông tin nhiệt độ, độ ẩm,... ; vẽ bảng, hiển thị lịch sử data của cảm biến, lịch sử bật tắt Led;...
* Cảm biến nhiệt độ (DHT11): Đo nhiệt độ và độ ẩm.
* Cảm biến ánh sáng: Đo cường độ ánh sáng.
* Các điện trở 1k ôm.
* Dây breadboard.
* Breadboard.
* Nguồn cấp: Micro USB.
* File "public" chứa các code html.
  
Phần mềm:
* Arduino IDE: lập trình và nạp code cho ESP8266.
* Notepad: đổi đuôi .txt thành .html, .js để tạo code cho Node.js.
* Trình duyệt web để chạy.

Kết nối mạch:

1. DHT 11:
* Chân VCC nối với 3.3V của ESP8266.
* Chân GND nối với GND của ESP8266.
* Chân Data nối với chân D2 của ESP8266.
  
2. Cảm biến ánh sáng:
* Chân VCC nối với 3.3V của ESP8266.
* Chân GND nối với GND của ESP8266.
* Chân A0 nối với chân A0 của ESP8266.
* Chân D0 nối với chân D1 của ESP8266 (chưa sử dụng).

3. Các Led:
* Cực âm của Led nối với GND của ESP8266.
* Mỗi cực dương nối với mỗi trở 1k ôm rồi nối lần lượt với D0, D5, D6, D8.

Cài đặt:
1. Cài đặt Arduino IDE và thêm các setup cho ESP8266.
2. Cài đặt các thư viện cần thiết: ESP8266WiFi.h, PubSubClient.h, DHT.h, time.h.
3. Kết nối ESP8266 với máy tính qua cổng USB, chọn board ESP8266, chọn COM tương ứng.
4. Nạp code "mangcambien.ino" cho ESP8266 qua Arduino.

Cấu hình WIFI và MQTT:
        
1. Cấu hình lại Wifi cho phù hợp:

    const char* ssid = "Tên mạng"; 

    const char* password = "Mật Khẩu mạng";

    const char* mqtt_server = "Địa chỉ IP";

2. Thay đổi user, password và port.

Hiển thị dữ liệu trên web:

1. Ghi dữ liệu vào database MySQL và đẩy data lên Web: "sen.js"
2. Giao diện web:
* Cấu trúc thư mục mẫu:
  
sen.js

_public

__ index.html

__ search.html

__ mua.html

* Khởi chạy file code "sen.js" để cập nhật dữ liệu trang web liên tục r dùng trình duyệt gõ "http://localhost:3000/" để mở web.

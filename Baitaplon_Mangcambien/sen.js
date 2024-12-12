const mqtt = require('mqtt');
const mysql = require('mysql2');
const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());

// Kết nối đến MQTT Broker
const mqttClient = mqtt.connect('mqtt://192.168.137.1:1110', {
    username: 'def',
    password: '123456'
});

// Kết nối đến MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',   // Thay thế 'your_mysql_user' bằng user MySQL của bạn
    password: '123456',  // Thay thế 'your_mysql_password' bằng mật khẩu MySQL của bạn
    database: 'mqtt_data'  // Thay thế 'your_database' bằng tên database của bạn
});

// Kiểm tra kết nối MySQL
db.connect((err) => {
    if (err) {
        console.log('Không thể kết nối MySQL: ', err);
        return;
    }
    console.log('Đã kết nối MySQL');
});


// Thiết lập thư mục public để phục vụ các file tĩnh
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint để lấy tất cả dữ liệu từ bảng sensor_data
app.get('/api/sensor_data/all', (req, res) => {
    const query = `
        SELECT ID, Time, Temp, Hum, Light, MUA, GIO, NANG
        FROM sensor_data 
        ORDER BY Time DESC;
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Lỗi khi truy vấn sensor_data' });
        }
        res.json(results); // Trả về tất cả dữ liệu từ bảng sensor_data
    });
});

// Endpoint để lấy 8 bản ghi mới nhất từ bảng sensor_data
app.get('/api/sensor_data/latest', (req, res) => {
    const query = `
        SELECT ID, Time, Temp, Hum, Light, MUA, GIO, NANG
        FROM sensor_data 
        ORDER BY Time DESC
        LIMIT 8;
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Lỗi khi truy vấn sensor_data' });
        }
        res.json(results); // Trả về 8 bản ghi mới nhất từ bảng sensor_data
    });
});


// Endpoint để lấy 3 bản ghi mới nhất từ bảng sensor_data
app.get('/api/sensor_data/latest1', (req, res) => {
    const query = `
        SELECT ID, Time, Temp, Hum, Light, MUA, GIO, NANG
        FROM sensor_data 
        ORDER BY Time DESC
        LIMIT 3;
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Lỗi khi truy vấn sensor_data' });
        }
        res.json(results); // Trả về 8 bản ghi mới nhất từ bảng sensor_data
    });
});




// Endpoint để lấy tất cả dữ liệu từ bảng devices
app.get('/api/devices/all', (req, res) => {
    const query = `
        SELECT * 
        FROM devices 
        ORDER BY Time DESC;
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Lỗi khi truy vấn devices' });
        }
        res.json(results); // Trả về tất cả dữ liệu từ bảng devices
    });
});

// Endpoint để lấy tất cả dữ liệu từ bảng w
app.get('/api/w/all', (req, res) => {
    const query = `
        SELECT * 
        FROM w 
        ORDER BY Time DESC;
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Lỗi khi truy vấn w' });
        }
        res.json(results); // Trả về tất cả dữ liệu từ bảng devices
    });
});


// Endpoint control-
app.post('/control-led', (req, res) => {
    const { device, action } = req.body;

    if (device && (action === 'ON' || action === 'OFF')) {
        let message;
        
        if (device === 'ALL') {
            message = action === 'ON' ? 'ON_ALL' : 'OFF_ALL';
        } else {
            message = `${device}_${action}`;
        }

        // Gửi tin nhắn qua MQTT
        mqttClient.publish('inTopic', message, (err) => {
            if (err) {
                console.log('Lỗi khi gửi tin nhắn qua MQTT:', err);
                res.status(500).json({ error: 'Lỗi khi gửi tin nhắn qua MQTT' });
            } else {
                console.log(`Đã gửi tin nhắn: ${message}`);
                res.json({ message: `Đã gửi lệnh ${action} cho ${device}` });
            }
        });
    } else {
        res.status(400).json({ error: 'Thiết bị hoặc hành động không hợp lệ' });
    }
});





// Lắng nghe tin nhắn từ MQTT
mqttClient.on('connect', () => {
    console.log('Đã kết nối MQTT');
    mqttClient.subscribe('outTopic', (err) => {
        if (err) {
            console.log('Lỗi khi subscribe: ', err);
        }
    });

    // Subscribe vào topic inTopic để lắng nghe tin nhắn từ đây
    mqttClient.subscribe('inTopic', (err) => {
        if (err) {
            console.log('Lỗi khi subscribe inTopic: ', err);
        }
    });
});

// Hàm xử lý tin nhắn MQTT và đẩy vào MySQL
mqttClient.on('message', (topic, message) => {
    const data = message.toString();
    console.log('Dữ liệu nhận được:', data);

// Xử lý các tin nhắn từ outTopic
if (topic === 'outTopic') {
    const regex = /Time: ([\d\- :]+), Temp: ([\d\.]+) °C, Hum: (\d+)%?, Light: (\d+) Lux, MUA: (\d+), GIO: (\d+), NANG: (\d+)/;
    const match = data.match(regex);

    if (match) {
        const time = match[1];
        const temp = parseFloat(match[2]);
        const humidity = parseInt(match[3]);
        const light = parseInt(match[4]);
        const mua = parseInt(match[5]);
        const gio = parseInt(match[6]);
        const nang = parseInt(match[7]);

        // Kiểm tra năm của thời gian
        const year = parseInt(time.split('-')[0]);  // Giả sử định dạng thời gian là "YYYY-MM-DD HH:MM:SS"
        
        if (mua >= 60) {
    // Chèn cảnh báo vào bảng w
    const warningQuery = `INSERT INTO w (W, Action, Time) VALUES ('Danger', 'ON', ?)`;
    db.query(warningQuery, [time], (err, result) => {
        if (err) console.log('Lỗi khi chèn cảnh báo vào bảng w: ', err);
        else console.log('Đã chèn cảnh báo vào bảng w thành công: ', result);
    });
}

        
        if (year >= 2024 && temp > 0 && temp < 50 && humidity > 0 && humidity <= 100 && light > 100 && light <= 1010) {
            const query = 'INSERT INTO sensor_data (Temp, Hum, Light, MUA, GIO, NANG, Time) VALUES (?, ?, ?, ?, ?, ?, ?)';
            db.query(query, [temp, humidity, light, mua, gio, nang, time], (err, result) => {
                if (err) console.log('Lỗi khi chèn dữ liệu vào sensor_data: ', err);
                else console.log('Đã chèn dữ liệu vào sensor_data thành công: ', result);
            });
        }
    }
}


// Xử lý các tin nhắn từ inTopic
    if (topic === 'inTopic') {
        const actionRegex = /(ON_ALL|OFF_ALL|LED[1-3]_(ON|OFF))/; // Regex cho tất cả hành động
        const timeRegex = /Time: (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/; // Regex cho thời gian
        const actionMatch = data.match(actionRegex);

        const timeMatch = data.match(timeRegex);
        
        if (actionMatch && timeMatch) {
            const action = actionMatch[0]; // Lấy hành động từ tin nhắn
            const time = timeMatch[1]; // Lấy thời gian từ tin nhắn

            // Ghi vào bảng devices
            let devices = []; // Mảng để lưu tất cả hành động
            if (action === 'ON_ALL') {
                devices.push(['LED1', 'ON', time]);
                devices.push(['LED2', 'ON', time]);
                devices.push(['LED3', 'ON', time]);
            } else if (action === 'OFF_ALL') {
                devices.push(['LED1', 'OFF', time]);
                devices.push(['LED2', 'OFF', time]);
                devices.push(['LED3', 'OFF', time]);
            } else {
                // Xử lý cho các LED cụ thể
                const ledRegex = /(LED[1-3])_(ON|OFF)/;
                const ledMatch = action.match(ledRegex);
                if (ledMatch) {
                    const ledNumber = ledMatch[1]; // LED số
                    const ledAction = ledMatch[2]; // ON hoặc OFF
                    devices.push([ledNumber, ledAction, time]);
                }
            }

            // Chèn dữ liệu vào bảng devices
            devices.forEach(device => {
                
                const deviceQuery = `INSERT INTO devices (Device, Action, Time) VALUES (?, ?, ?)`;
                db.query(deviceQuery, device, (err, result) => {
                    if (err) {
                        console.log(`Lỗi khi chèn dữ liệu cho ${device[0]}: `, err);
                    } else {
                        console.log(`Đã chèn hành động cho ${device[0]} thành công: `, result);
                    }
                  
                });
            });

            // Gửi lại dữ liệu vừa chèn lên MQTT
            const messageToSend = `${action} Time: ${time}`;
            mqttClient.publish('outTopic', messageToSend, (err) => {
                if (err) {
                    console.log('Lỗi khi gửi tin nhắn qua MQTT: ', err);
                } else {
                    console.log('Đã gửi tin nhắn qua MQTT: ', messageToSend);
                }
            });
        } else {
            console.log('Không tìm thấy hành động hoặc thời gian trong tin nhắn.');
        }
    }
});

// Khởi động server
app.listen(port, () => {
    console.log(`Server đang chạy trên http://localhost:${port}`);
});
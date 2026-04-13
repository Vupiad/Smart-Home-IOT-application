import paho.mqtt.client as mqtt
import json
import time
import random

# Thông tin cấu hình ThingsBoard Cloud
THINGSBOARD_HOST = "mqtt.thingsboard.cloud"
PORT = 1883
ACCESS_TOKEN = "T6L85alHs9qRth0q1qKn"
TOPIC = "v1/devices/me/telemetry"

def on_connect(client, userdata, flags, rc):
    """
    Hàm được gọi khi script kết nối tới MQTT Broker.
    """
    if rc == 0:
        print("\n[+] Đã kết nối thành công tới ThingsBoard!")
    else:
        print(f"\n[-] Kết nối thất bại, mã lỗi: {rc}")

def main():
    # Khởi tạo Web Client
    client = mqtt.Client()

    # Gắn mật khẩu (Access Token) cho thiết bị để ThingsBoard nhận diện
    client.username_pw_set(ACCESS_TOKEN)

    # Đăng ký hàm xử lý sự kiện
    client.on_connect = on_connect

    try:
        print(f"[*] Đang kết nối tới {THINGSBOARD_HOST}:{PORT}...")
        client.connect(THINGSBOARD_HOST, PORT, keepalive=60)
        
        # Bắt đầu vòng lặp ngầm để nhận và gửi message ổn định
        client.loop_start()

        print("[*] Đang vào vòng lặp gửi dữ liệu. Nhấn Ctrl+C để thoát.\n")
        
        # Vòng lặp gửi dữ liệu mô phỏng liên tục
        while True:
            # 1. Sinh random giá trị nhiệt độ, ví dụ từ 20 đến 35 độ
            temperature = round(random.uniform(20.0, 35.0), 2)
            
            # 2. Bạn cũng có thể thêm dữ liệu khác (ví dụ: độ ẩm)
            humidity = round(random.uniform(50.0, 90.0), 2)
            
            # 3. Tạo Payload chuẩn định dạng Thingsboard JSON
            payload = {
                "temperature": temperature,
                "humidity": humidity
            }
            
            # Chuyển từ Dict/Object trên Python sang chuỗi JSON string
            json_payload = json.dumps(payload)
            
            # 4. Publish lên broker
            print(f"-> Đang gửi: {json_payload}")
            client.publish(TOPIC, json_payload, qos=1)
            
            # Tạm dừng 60 giây trước khi gửi tiếp data mô phỏng
            time.sleep(60)

    except KeyboardInterrupt:
        print("\n[!] Đã ép dừng chương trình.")
    except Exception as e:
        print(f"\n[-] Có lỗi xảy ra: {e}")
    finally:
        client.loop_stop()
        client.disconnect()
        print("[*] Đã ngắt kết nối an toàn.")

if __name__ == '__main__':
    main()

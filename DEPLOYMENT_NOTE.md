# Операционная заметка о развертывании (Deployment Note)

## 1. Сводка развертывания
- **Публичный адрес (URL):** `https://proud-misc-upcoming-transmission.trycloudflare.com`
- **Тип адреса:** Временный (Cloudflare Quick Tunnel `*.trycloudflare.com`). Активен, пока работает процесс туннеля; при перезапуске без именного туннеля генерируется новый домен. Именные туннели и домен на хосте отсутствуют.
- **Локальный порт источника (Origin):** `127.0.0.1:4174`
- **Порт старого предпросмотра (v1):** `127.0.0.1:4173` (не затронут, процесс сохранён)

## 2. Процессы и логи
- **Cloudflare Tunnel:**
  - Systemd Unit: `classes-course-site-tunnel.service`
  - PID: `379460`
  - Файл логов: `/home/moses/classes-course-site/tunnel.log`
  - Файл PID: `/home/moses/classes-course-site/tunnel.pid`
- **Vite Preview (Port 4174):**
  - Systemd Unit: `classes-course-site-preview.service`
  - PID: `379794`
  - Файл логов: `/home/moses/classes-course-site/preview.log`

Оба процесса запущены под управлением `systemd --user` с включённым linger (`loginctl show-user moses -> Linger=yes`), поэтому процессы изолированы, автоматически перезапускаются при сбоях и выдерживают завершение SSH-сессии.

## 3. Команды управления

### Проверка статуса
```bash
systemctl --user status classes-course-site-tunnel.service classes-course-site-preview.service
```

### Просмотр логов
```bash
tail -f /home/moses/classes-course-site/tunnel.log
tail -f /home/moses/classes-course-site/preview.log
```

### Остановка
```bash
systemctl --user stop classes-course-site-tunnel.service
systemctl --user stop classes-course-site-preview.service
```

### Повторный запуск туннеля
```bash
systemd-run --user --unit=classes-course-site-tunnel \
  --description="Cloudflare Quick Tunnel for Classes Course Site (Port 4174)" \
  --working-directory=/home/moses/classes-course-site \
  --property=Restart=always \
  --property=RestartSec=10 \
  --property=StandardOutput=append:/home/moses/classes-course-site/tunnel.log \
  --property=StandardError=append:/home/moses/classes-course-site/tunnel.log \
  /home/moses/.local/bin/cloudflared tunnel --url http://127.0.0.1:4174 --no-autoupdate
```

### Повторный запуск preview-сервера
```bash
systemd-run --user --unit=classes-course-site-preview \
  --description="Vite Preview for Classes Course Site (Port 4174)" \
  --working-directory=/home/moses/classes-course-site \
  --property=Restart=always \
  --property=RestartSec=5 \
  --property=StandardOutput=append:/home/moses/classes-course-site/preview.log \
  --property=StandardError=append:/home/moses/classes-course-site/preview.log \
  /home/moses/.local/bin/node /home/moses/classes-course-site/node_modules/.bin/vite preview --host 127.0.0.1 --port 4174
```

## 4. Результаты проверки
1. **Локальный порт 4174 (корень `/`):** HTTP 200 OK, HTML содержит заголовок и метаданные курса v2.
2. **Локальный порт 4174 (мастерская `/workshop`):** HTTP 200 OK, HTML мастерской.
3. **Публичный адрес (`https://proud-misc-upcoming-transmission.trycloudflare.com`):** HTTP/2 200 OK.
4. **Публичный адрес мастерской (`https://proud-misc-upcoming-transmission.trycloudflare.com/workshop`):** HTTP/2 200 OK.
5. **Публичный бандл скриптов (`.../assets/main-DI2koo0n.js`):** HTTP/2 200 OK (308,542 bytes).
6. **Старый предпросмотр (`http://127.0.0.1:4173`):** HTTP 200 OK (PID 356666 не изменён).

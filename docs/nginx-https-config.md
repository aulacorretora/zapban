# HTTPS Configuration for ZapBan

This document describes the HTTPS configuration implemented for zapban.com using Let's Encrypt SSL certificates and Nginx.

## SSL Certificate Installation

The SSL certificate for zapban.com was obtained using Let's Encrypt's Certbot tool:

```bash
# Install Certbot and Nginx plugin
apt update
apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate and configure Nginx
certbot --nginx -d zapban.com
```

The certificate is automatically renewed by a cron job set up by Certbot.

## Nginx Configuration

The Nginx configuration includes:

1. HTTP to HTTPS redirection
2. SSL certificate configuration
3. WhatsApp API proxy rules

### Server Blocks

```nginx
# HTTP server block for redirection
server {
    listen 80;
    listen [::]:80;
    server_name zapban.com;
    
    # Redirect all HTTP traffic to HTTPS
    return 301 https://$host$request_uri;
}

# Default server block for other domains
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    server_name _;
    
    # Return 404 for unknown domains
    return 404;
}

# HTTPS server block
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    
    server_name zapban.com;
    
    # SSL certificate configuration
    ssl_certificate /etc/letsencrypt/live/zapban.com-0001/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zapban.com-0001/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Root directory and index files
    root /var/www/html;
    index index.html index.htm;
    
    # Frontend routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # WhatsApp API proxy rules
    location /api/whatsapp/connect {
        proxy_pass http://127.0.0.1:3000/connect;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api/whatsapp/status {
        proxy_pass http://127.0.0.1:3000/status;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api/whatsapp/update-status {
        proxy_pass http://127.0.0.1:3000/update-status;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Certificate Details

- **Domain**: zapban.com
- **Issuer**: Let's Encrypt
- **Validity**: 90 days (auto-renewed)
- **Certificate Path**: `/etc/letsencrypt/live/zapban.com-0001/fullchain.pem`
- **Key Path**: `/etc/letsencrypt/live/zapban.com-0001/privkey.pem`

## Testing

The HTTPS configuration was tested to ensure:

1. Successful HTTPS access to zapban.com
2. Automatic redirection from HTTP to HTTPS
3. Proper functioning of WhatsApp API endpoints over HTTPS:
   - `/api/whatsapp/status`
   - `/api/whatsapp/update-status`
   - `/api/whatsapp/connect`

All tests were successful, confirming that the HTTPS configuration is working correctly.

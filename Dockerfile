# Gunakan Node.js versi stabil
FROM node:18

# Set direktori kerja di dalam container
WORKDIR /usr/src/app

# Salin package.json dan package-lock.json dulu
COPY package*.json ./

# Install dependencies
RUN npm install

# Salin semua file project ke container
COPY . .

# Expose port yang dipakai Express
EXPOSE 3000

# Jalankan index.js saat container start
CMD ["node", "index.js"]

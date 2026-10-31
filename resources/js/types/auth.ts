export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

// Menyimpan informasi autentikasi pengguna yang sedang mengakses aplikasi.
export type Auth = {
    user: User | null;
};

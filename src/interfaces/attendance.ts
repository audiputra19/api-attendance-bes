export interface Employees {
    nik: number;
    nama: string; 
}

export interface Lembur {
    no_spl: string;
    real_in: string | number;
    real_ov: string | number;
}

export interface Libur {
    keterangan: string;
    halfd: number;
}

export interface Puasa {
    tanggal: string;
    tanggal_2: string;
}

export interface HariKerja {
    jam_msk: string;
    ist_klr: string;
    ist_msk: string;
    jam_klr: string;
}

export interface DataReqAttendance {
    employee: Employees;
    hariKerja: string;
}

export interface Absen {
    jam_msk: string; 
    jam_is_klr: string;
    jam_is_msk: string;
    jam_klr: string;
    tlt: number;
    tlt_is: number;
    alpa: number;
}
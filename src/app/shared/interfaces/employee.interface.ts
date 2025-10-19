export interface IEmployee {
    id?: number;
    employee_id: string; 
    first_name: string;
    last_name: string;
    middle_name?: string;
    position_id: number;
    position_name?: string;
    address?: string; 
    contact_email: string;
    contact_phone: string;
    salary: number;
    created_at?: string;
    updated_at?: string;
}

export interface IPosition {
    id?: number;
    name: string;
    created_at?: string;
}

export interface IAdminUser {
    id?: number;
    username: string;
    password?: string;
    created_at?: string;
}
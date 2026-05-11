interface RegisterDTO {
    name: string;
    email: string;
    phone: string;
    hashedPassword: string;
    role?: string;
}

export class UserAdapter {
    static toDBModel(dto: RegisterDTO) {
        return {
            full_name: dto.name,
            email: dto.email,
            phone: dto.phone,
            password: dto.hashedPassword,
            role: dto.role,
        };
    }

    static toResponseDTO(doc: any) {
        return {
            id: doc._id,
            name: doc.full_name,
            email: doc.email,
            phone: doc.phone,
            role: doc.role,
        };
    }
}

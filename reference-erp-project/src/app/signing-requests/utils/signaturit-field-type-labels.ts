import type { SignaturitFieldType } from "@/types/general/signing-requests";

/** i18n keys for Signaturit field type names (same as the field-type selector in the sheet). */
export const signaturitFieldTypeLabelKey = (ft: SignaturitFieldType): string => {
    const map: Record<SignaturitFieldType, string> = {
        signature: "signingRequests.create.signaturitType.signature",
        name: "signingRequests.create.signaturitType.name",
        surname: "signingRequests.create.signaturitType.surname",
        date: "signingRequests.create.signaturitType.date",
        city: "signingRequests.create.signaturitType.city",
        textArea: "signingRequests.create.signaturitType.textArea",
        Company: "signingRequests.create.signaturitType.Company",
        checkbox: "signingRequests.create.signaturitType.checkbox",
        radio: "signingRequests.create.signaturitType.radio",
        image: "signingRequests.create.signaturitType.image",
        dropdown: "signingRequests.create.signaturitType.dropdown",
        email: "signingRequests.create.signaturitType.email",
        phone: "signingRequests.create.signaturitType.phone",
        zip: "signingRequests.create.signaturitType.zip",
        dni: "signingRequests.create.signaturitType.dni",
        age: "signingRequests.create.signaturitType.age",
        iban: "signingRequests.create.signaturitType.iban",
    };
    return map[ft];
};

/** English fallbacks for `t()` (default field name matches field type label). */
export const signaturitFieldTypeDefaultLabel = (ft: SignaturitFieldType): string => {
    const map: Record<SignaturitFieldType, string> = {
        signature: "Signature",
        name: "Name",
        surname: "Surname",
        date: "Date",
        city: "City",
        textArea: "Text area",
        Company: "Company",
        checkbox: "Checkbox",
        radio: "Radio",
        image: "Image",
        dropdown: "Dropdown",
        email: "Email",
        phone: "Phone",
        zip: "ZIP",
        dni: "DNI",
        age: "Age",
        iban: "IBAN",
    };
    return map[ft];
};

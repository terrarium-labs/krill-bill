import { useRole } from "../../context/RoleContext";
import { RoleInfoCard } from "../components/role-info-card";
import RoleUsersSection, { RoleUsersRef } from "../components/role-users-section";
import { useRef, useState } from "react";
import RoleUsersAddModal from "../components/role-users-add-modal";
import { useParams } from "react-router";

const RoleUsersTab = () => {
    const { role } = useRole();
    const { orgId, roleId } = useParams();
    const usersRef = useRef<RoleUsersRef>(null);
    const [addUsersModalOpen, setAddUsersModalOpen] = useState(false);

    const handleAddUserClick = () => {
        setAddUsersModalOpen(true);
    };

    const handleUsersAdded = () => {
        usersRef.current?.refreshUsers();
    };

    if (!role) return null;

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="flex flex-col gap-4 mb-24 lg:col-span-1">
                    <RoleInfoCard />
                </div>
                <div className="lg:col-span-2">
                    <RoleUsersSection
                        ref={usersRef}
                        onAddUserClick={handleAddUserClick}
                    />
                </div>
            </div>

            {/* Add Users Modal */}
            {orgId && roleId && (
                <RoleUsersAddModal
                    open={addUsersModalOpen}
                    onOpenChange={setAddUsersModalOpen}
                    onUsersAdded={handleUsersAdded}
                    orgId={orgId}
                    roleId={roleId}
                />
            )}
        </>
    );
};

export default RoleUsersTab;
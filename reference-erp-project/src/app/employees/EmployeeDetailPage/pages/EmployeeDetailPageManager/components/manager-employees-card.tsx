import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { useEffect, useState } from "react";
import { getManagerEmployees } from "@/api/managers/time-records/time-records";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import SearchBar from "@/app/components/search-bar";
import { Clock, Edit, Loader2, Calendar, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Employee } from "@/types/employees/employees";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";
import Tag from "@/app/components/tag/tag";

interface ManagerEmployee extends Employee {
    is_relations?: boolean;
    is_absence_reporting?: boolean;
}

interface ManagerEmployeesCardProps {
    managerId: string;
    selectedEmployee: Employee | null;
    setSelectedEmployee: (employee: Employee | null) => void;
}

const ManagerEmployeesCard = ({ managerId, selectedEmployee, setSelectedEmployee }: ManagerEmployeesCardProps) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [employees, setEmployees] = useState<ManagerEmployee[]>([]);
    const [allEmployees, setAllEmployees] = useState<ManagerEmployee[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const navigate = useNavigate();
    // Fetch employees function
    const fetchEmployees = async (search?: string) => {
        setIsLoading(true);
        setIsSearching(true);
        if (!orgId || !managerId) return;

        try {
            const response = await getManagerEmployees(orgId, managerId, search);
            if (response.success && response.success.employees) {
                setAllEmployees(response.success.employees);
                // Apply search filter if there's a search query
                if (search) {
                    const searchLower = search.toLowerCase();
                    const filtered = response.success.employees.filter((emp: ManagerEmployee) => {
                        return (
                            emp.first_name?.toLowerCase().includes(searchLower) ||
                            emp.last_name?.toLowerCase().includes(searchLower) ||
                            emp.email?.toLowerCase().includes(searchLower)
                        );
                    });
                    setEmployees(filtered);
                } else {
                    setEmployees(response.success.employees);
                }
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("employees.manager.errorFetchingEmployees", "Error fetching employees"));
            }
        } catch (error) {
            toast.error(t("employees.manager.errorFetchingEmployees", "Error fetching employees"));
        } finally {
            setIsLoading(false);
            setIsSearching(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchEmployees();
    }, [managerId]);

    // Handle search query changes
    useEffect(() => {
            if (allEmployees.length > 0) {
                if (searchQuery) {
                    const searchLower = searchQuery.toLowerCase();
                    const filtered = allEmployees.filter((emp: ManagerEmployee) => {
                    return (
                        emp.first_name?.toLowerCase().includes(searchLower) ||
                        emp.last_name?.toLowerCase().includes(searchLower) ||
                        emp.email?.toLowerCase().includes(searchLower)
                    );
                });
                setEmployees(filtered);
            } else {
                setEmployees(allEmployees);
            }
        }
    }, [searchQuery, allEmployees]);

    // Load more employees
    const loadMoreEmployees = async () => {
        if (!orgId || !managerId || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getManagerEmployees(orgId, managerId, searchQuery || undefined, nextPageToken);
            if (response.success && response.success.employees) {
                const newAllEmployees = [...allEmployees, ...response.success.employees];
                setAllEmployees(newAllEmployees);

                // Apply search filter if there's a search query
                if (searchQuery) {
                    const searchLower = searchQuery.toLowerCase();
                    const filtered = newAllEmployees.filter((emp: Employee) => {
                        return (
                            emp.first_name?.toLowerCase().includes(searchLower) ||
                            emp.last_name?.toLowerCase().includes(searchLower) ||
                            emp.email?.toLowerCase().includes(searchLower)
                        );
                    });
                    setEmployees(filtered);
                } else {
                    setEmployees(prev => [...prev, ...response.success.employees]);
                }
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("employees.manager.errorFetchingEmployees", "Error fetching employees"));
            }
        } catch (error) {
            toast.error(t("employees.manager.errorFetchingEmployees", "Error fetching employees"));
        } finally {
            setLoadingMore(false);
        }
    };

    return (
        <Card className="w-full shadow-none">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-between">
                    {t('employees.manager.employees', 'Team Members')}
                    <Tag text={`Total: ${employees.length}`} color={'gray'} />
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Search Bar */}
                <SearchBar
                    value={searchQuery}
                    className="w-full"
                    isLoading={isSearching}
                    onChange={(query) => setSearchQuery(query)}
                    onSearch={() => { }}
                    placeholder={t("employees.manager.searchEmployees", "Search employees...")}
                />

                {/* Employees List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : employees.length === 0 ? (
                    <div className="text-center py-4">
                        <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <h3 className="text-md font-medium text-muted-foreground">
                            {t('employees.manager.noEmployees', 'No team members')
                            }
                        </h3>
                        <p className="text-muted-foreground mb-4 text-xs">
                            {t('employees.manager.noEmployeesDescription', 'This manager has no team members yet')
                            }
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {employees.map((emp) => (
                            <div
                                key={emp.id}
                                className={cn(
                                    "w-full h-auto py-2.5 px-3 rounded-md transition-colors cursor-pointer hover:bg-accent hover:text-accent-foreground",
                                    selectedEmployee?.id === emp.id && "bg-muted"
                                )}
                                onClick={() => setSelectedEmployee(selectedEmployee?.id === emp.id ? null : emp)}
                            >
                                <div className="flex items-center gap-2 justify-between w-full">
                                    <div className="flex gap-3 items-center w-full">
                                        <EmployeeAvatar employee={emp} showEmail={true} />
                                    </div>
                                    <div className="flex items-center">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/${orgId}/employees/${emp.id}`);
                                            }}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (emp.is_absence_reporting) {
                                                    navigate(`/${orgId}/managers/${managerId}/absences?employeeId=${emp.id}`);
                                                }
                                            }}
                                            className={!emp.is_absence_reporting ? "invisible" : ""}
                                        >
                                            <Calendar className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (emp.is_relations) {
                                                    navigate(`/${orgId}/managers/${managerId}/time-records?employeeId=${emp.id}`);
                                                }
                                            }}
                                            className={!emp.is_relations ? "invisible" : ""}
                                        >
                                            <Clock className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Load More Button */}
                {nextPageToken && (
                    <div className="flex justify-center mt-4">
                        <Button
                            variant="outline"
                            onClick={loadMoreEmployees}
                            disabled={loadingMore}
                            className="min-w-32"
                        >
                            {loadingMore ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t("common.loading", "Loading...")}
                                </>
                            ) : (
                                t("common.loadMore", "Load More")
                            )}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ManagerEmployeesCard;


export interface IUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    permissions: {
      id: string;
      name: string;
      apiPath: string;
      method: string;
      module: string;
    }[];
  };
}

export interface IListUser<User> {
  info: User;
  role: {
    id: string;
    name: string;
  };
}

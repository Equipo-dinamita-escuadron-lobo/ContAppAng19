export interface HelpCenter {
  id?: number;
  moduleId: number;
  name: string;
  description: string;
  status: boolean;
}

export interface HelpCenterList extends HelpCenter {
  moduleName?: string;
}
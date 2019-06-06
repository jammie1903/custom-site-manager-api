import { IProject, IUser } from '../../interfaces';
import { Persisted } from '../../types';

export interface IDeploymentService {
  deploy(user: Persisted<IUser>, project: Persisted<IProject>): Promise<void>
  poll(project: IProject): Promise<void>
}

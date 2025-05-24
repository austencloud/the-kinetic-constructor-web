import { ServiceContainer } from './ServiceContainer';

let container: ServiceContainer;

export function getContainer(): ServiceContainer {
	if (!container) {
		container = new ServiceContainer();
	}
	return container;
}

export function createContainer(): ServiceContainer {
	return new ServiceContainer();
}

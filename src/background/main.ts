import "reflect-metadata";
import DeviceManager from "./deviceManager/deviceManager";
import {ServiceCollection} from "./commons/dependencyInjection/serviceCollection";
import {IInstantiationService} from "./commons/dependencyInjection/instantiation";
import {IDeviceManager} from "./domains/ideviceManager";
import {InstantiationService} from "./commons/dependencyInjection/InstantiationService";
import {IMediator, Mediator} from "./commons/Mediator/imediator";
import {SyncDescriptor} from "./commons/dependencyInjection/descriptors";

import {DatabaseManager, IDatabaseManager} from "./database/service/DatabaseManager";
import {DeviceRepo} from "./database/service/DeviceRepo";
import {IDeviceContext} from "./domains/ideviceContext";
import {DeviceController, IDeviceController} from "./controllers/deviceController";
import {IMainWindowService, WindowService} from "./service/windowService";
import {MainStartup} from "./startup";

import {ILoadDataRequestHandler, LoadDataRequestHandler} from "./application/Device/loadDataDevice";
import {AddDeviceRequestHandler, IAddDeviceRequestHandler} from "./application/Device/addDevice";
import {ISendMessageRequestHandler, SendMessageRequestHandler} from "./application/Device/sendMessage";
import {IRemoveDeviceRequestHandler, RemoveDeviceRequestHandler} from "./application/Device/removeDevice";
import {ConnectDeviceRequestHandler, IConnectDeviceRequestHandler} from "./application/Device/connectDevice";
import {CloseDeviceRequestHandler, ICloseDeviceRequestHandler} from "./application/Device/closeDevice";
import {ILoadCommandRequestHandler, LoadCommandRequestHandler} from "./application/Command/loadCommand";
import {ClipboardService, IClipboardService} from "./service/ClipboardService";
import {AddCommandRequestHandler, IAddCommandRequestHandler } from "./application/Command/addCommand";


class Startup {

    private services: ServiceCollection;

    private createServices(): [IInstantiationService] {
        this.services = new ServiceCollection();
        let windowService = new WindowService();
        this.services.set(IMainWindowService, windowService);
        this.services.set(IDeviceManager, new DeviceManager(windowService))
        this.services.set(IDatabaseManager, new DatabaseManager())
        this.services.set(IDeviceContext, new SyncDescriptor(DeviceRepo))
        this.services.set(IClipboardService,new SyncDescriptor(ClipboardService))
        this.services.set(IDeviceController, new SyncDescriptor(DeviceController))
        this.services.set(IAddDeviceRequestHandler, new SyncDescriptor(AddDeviceRequestHandler));
        this.services.set(ILoadCommandRequestHandler, new SyncDescriptor(LoadCommandRequestHandler));
        this.services.set(ICloseDeviceRequestHandler, new SyncDescriptor(CloseDeviceRequestHandler));
        this.services.set(IRemoveDeviceRequestHandler, new SyncDescriptor(RemoveDeviceRequestHandler));
        this.services.set(IConnectDeviceRequestHandler, new SyncDescriptor(ConnectDeviceRequestHandler));
        this.services.set(ISendMessageRequestHandler, new SyncDescriptor(SendMessageRequestHandler));
        this.services.set(ILoadDataRequestHandler, new SyncDescriptor(LoadDataRequestHandler));
        this.services.set(IAddCommandRequestHandler, new SyncDescriptor(AddCommandRequestHandler));

        return [new InstantiationService(this.services, true)];
    }

    run() {
        const [instantiationService] = this.createServices();
        instantiationService.invokeFunction(accessor => {
            this.services.set(IMediator, new Mediator(accessor));
            const windowService = accessor.get(IMainWindowService);
            instantiationService.createInstance(MainStartup, windowService, accessor)
        })
    }
}


new Startup().run();

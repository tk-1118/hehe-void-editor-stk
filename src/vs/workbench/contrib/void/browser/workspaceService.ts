import { localize2 } from '../../../../nls.js';
import { URI } from '../../../../base/common/uri.js';
import { Action2, registerAction2, MenuId } from '../../../../platform/actions/common/actions.js';
import { ServicesAccessor } from '../../../../editor/browser/editorExtensions.js';
import { INotificationService } from '../../../../platform/notification/common/notification.js';
import { IFileService } from '../../../../platform/files/common/files.js';
import { IClipboardService } from '../../../../platform/clipboard/common/clipboardService.js';
import { IDirectoryStrService } from '../common/directoryStrService.js';
import { messageOfSelection } from '../common/prompt/prompts.js';
import { IVoidModelService } from '../common/voidModelService.js';
import { ExplorerFolderContext } from '../../files/common/files.js';


class WorkspaceService extends Action2 {
	private static readonly VOID_WORKSPACE_ASSOCIATION_ID = 'void.workspaceassociation'

	constructor() {
		super({
			id: WorkspaceService.VOID_WORKSPACE_ASSOCIATION_ID,
			title: localize2('voidWorkspaceAssociation', 'Void: Workspace Association'),
			menu: [{
				id: MenuId.ExplorerContext,
				group: '9_void',
				order: 1,
				when: ExplorerFolderContext
			}]
		});
	}

	async run(accessor: ServicesAccessor, uri: URI): Promise<void> {
		try {
			const fileService = accessor.get(IFileService);
			const clipboardService = accessor.get(IClipboardService)
			const directoryStrService = accessor.get(IDirectoryStrService)
			const voidModelService = accessor.get(IVoidModelService)

			const stat = await fileService.stat(uri)

			const folderOpts = {
				maxChildren: 1000,
				maxCharsPerFile: 2_000_000,
			} as const

			let m: string = 'No contents detected'
			if (stat.isFile) {
				m = await messageOfSelection({
					type: 'File',
					uri,
					language: (await voidModelService.getModelSafe(uri)).model?.getLanguageId() || '',
					state: { wasAddedAsCurrentFile: false, },
				}, {
					folderOpts,
					directoryStrService,
					fileService,
				})
			}

			if (stat.isDirectory) {
				m = await messageOfSelection({
					type: 'Folder',
					uri,
				}, {
					folderOpts,
					fileService,
					directoryStrService,
				})
			}

			await clipboardService.writeText(m)

		} catch (error) {
			const notificationService = accessor.get(INotificationService)
			notificationService.error(error + '')
		}
	}

}

registerAction2(WorkspaceService)

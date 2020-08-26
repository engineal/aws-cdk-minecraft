export interface SpigotTypeProps {

    /**
     * Optional url to download Spigot
     */
    readonly spigotDownloadUrl?: string;

    /**
     * Optionally build Spigot from source
     */
    readonly buildFromSource?: boolean;
}

export abstract class JavaWorldType {

    /**
     * @returns {JavaWorldType} Forge server mode with optional version
     * @param {number} forgeVersion optional version to install
     */
    static forge(forgeVersion?: number): JavaWorldType {
        return {
            environment: {
                FORGEVERSION: forgeVersion ? String(forgeVersion) : undefined
            },
            type: 'FORGE'
        };
    }

    /**
     * @returns {JavaWorldType} Forge server mode with pre-downloaded Forge installer
     * @param {string} forgeInstaller the path to the pre-downloaded Forge installer in the /data directory
     */
    static forgeInstaller(forgeInstaller: string): JavaWorldType {
        return {
            environment: {
                FORGE_INSTALLER: forgeInstaller
            },
            type: 'FORGE'
        };
    }

    /**
     * @returns {JavaWorldType} Forge server mode with Forge installer from a custom location
     * @param {string} forgeInstallerUrl the URL to download the forge installer
     */
    static forgeInstallerUrl(forgeInstallerUrl: string): JavaWorldType {
        return {
            environment: {
                FORGE_INSTALLER_URL: forgeInstallerUrl
            },
            type: 'FORGE'
        };
    }

    /**
     * @returns {JavaWorldType} Bukkit server mode
     * @param {string} bukkitDownloadUrl optional url to download Bukkit
     */
    static bukkit(bukkitDownloadUrl?: string): JavaWorldType {
        return {
            environment: {
                BUKKIT_DOWNLOAD_URL: bukkitDownloadUrl
            },
            type: 'BUKKIT'
        };
    }

    /**
     * @returns {JavaWorldType} Spigot server mode
     * @param {SpigotTypeProps} props Spigot server type props
     */
    static spigot(props?: SpigotTypeProps): JavaWorldType {
        return {
            environment: {
                BUILD_FROM_SOURCE: props?.buildFromSource ? String(props.buildFromSource) : undefined,
                SPIGOT_DOWNLOAD_URL: props?.spigotDownloadUrl
            },
            type: 'SPIGOT'
        };
    }

    /**
     * @returns {JavaWorldType} Paper Spigot server mode
     * @param {number} paperBuild optional build number to use
     * @param {string} paperDownloadUrl optional download url for Paper Spigot
     */
    static paperSpigot(paperBuild?: number, paperDownloadUrl?: string): JavaWorldType {
        return {
            environment: {
                PAPERBUILD: paperBuild ? String(paperBuild) : undefined,
                PAPER_DOWNLOAD_URL: paperDownloadUrl
            },
            type: 'PAPER'
        };
    }

    /**
     * @returns {JavaWorldType} Tuinity server mode
     */
    static tuinity(): JavaWorldType {
        return {
            type: 'TUINITY'
        };
    }

    /**
     * @returns {JavaWorldType} Magma server mode
     */
    static magma(): JavaWorldType {
        return {
            type: 'MAGMA'
        };
    }

    /**
     * @returns {JavaWorldType} Mohist server mode
     */
    static mohist(): JavaWorldType {
        return {
            type: 'MOHIST'
        };
    }

    /**
     * @returns {JavaWorldType} Catserver server mode
     */
    static catserver(): JavaWorldType {
        return {
            type: 'CATSERVER'
        };
    }

    /**
     * @returns {JavaWorldType} Feed the Beast server mode
     * @param {number} modpackId The numerical ID of the modpack to install.
     * @param {number} versionId optional numerical id of the version to install
     */
    static feedTheBeast(modpackId: number, versionId?: number): JavaWorldType {
        return {
            environment: {
                FTB_MODPACK_ID: String(modpackId),
                FTB_MODPACK_VERSION_ID: versionId ? String(versionId) : undefined
            },
            type: 'FTBA'
        };
    }

    /**
     * @returns {JavaWorldType} CurseForge server mode
     * @param {string} curseForgeServerMod the path to the CurseForge server
     */
    static curseForge(curseForgeServerMod: string): JavaWorldType {
        return {
            environment: {
                CF_SERVER_MOD: curseForgeServerMod
            },
            type: 'CURSEFORGE'
        };
    }

    /**
     * @returns {JavaWorldType} SpongeVanilla server mode
     * @param {string} spongeVersion optional version to install
     */
    static spongeVanilla(spongeVersion?: string): JavaWorldType {
        return {
            environment: {
                SPONGEVERSION: spongeVersion
            },
            type: 'SPONGEVANILLA'
        };
    }

    /**
     * @returns {JavaWorldType} Fabric server mode with optional version
     * @param {string} fabricVersion optional version to install
     */
    static fabric(fabricVersion?: string): JavaWorldType {
        return {
            environment: {
                FABRICVERSION: fabricVersion
            },
            type: 'FABRIC'
        };
    }

    /**
     * @returns {JavaWorldType} Fabric server mode with pre-downloaded Fabric installer
     * @param {string} fabricInstaller the path to the pre-downloaded Fabric installer in the /data directory
     */
    static fabricInstaller(fabricInstaller: string): JavaWorldType {
        return {
            environment: {
                FABRIC_INSTALLER: fabricInstaller
            },
            type: 'FABRIC'
        };
    }

    /**
     * @returns {JavaWorldType} Fabric server mode with Fabric installer from a custom location
     * @param {string} fabricInstallerUrl the URL to download the Fabric installer
     */
    static fabricInstallerUrl(fabricInstallerUrl: string): JavaWorldType {
        return {
            environment: {
                FORGE_INSTALLER_URL: fabricInstallerUrl
            },
            type: 'FABRIC'
        };
    }

    static custom(customServer: string): JavaWorldType {
        return {
            environment: {
                CUSTOM_SERVER: customServer
            },
            type: 'CUSTOM'
        };
    }

    /**
     * The TYPE environment variable
     */
    abstract readonly type: string;

    /**
     * Additional environment variables to add to the container
     */
    abstract readonly environment?: { [key: string]: string | undefined };

}

// External libraries
import { action } from "mobx";

// External modules
import { Adb } from "@yume-chan/adb";
import { PackageManager } from "@yume-chan/android-bin";
import {
  ReadableStream,
  WrapReadableStream,
  WritableStream,
} from "@yume-chan/stream-extra";

export class AdbUtil {
  private readonly adb: Adb;

  constructor(adb: Adb) {
    this.adb = adb;
  }

  public async install(packageName: string, path: string): Promise<boolean> {
    const stream = await this.createFileStream(path);
    if (!stream) {
      return false;
    }

    const pm = new PackageManager(this.adb);
    await pm.pushAndInstallStream(stream);

    return (
      // Check installed packages
      ((await this.getInstalledPackages()) ?? []).find(
        (value) => value === packageName
      ) !== undefined
    );
  }

  private async createFileStream(
    path: string
  ): Promise<ReadableStream<Uint8Array> | undefined> {
    let response = await fetch(path, { method: "GET" });
    if (!response.ok) {
      return undefined;
    }
    return new WrapReadableStream<Uint8Array>(
      response.body as ReadableStream<Uint8Array>
    );
  }

  public async shell(command: string): Promise<string | undefined> {
    const ret = await this.adb.subprocess.shell(command);
    if (ret === undefined) {
      return;
    }
    return await this.readUint8ArrayLog(ret.stdout);
  }

  private async readUint8ArrayLog(
    stream: ReadableStream<Uint8Array>
  ): Promise<string> {
    let result = "";
    await stream.pipeTo(
      new WritableStream({
        write: action((chunk) => {
          result += new TextDecoder().decode(chunk);
        }),
      })
    );
    return result;
  }

  public async getInstalledPackages(): Promise<string[] | undefined> {
    const ret = await this.shell("pm list packages | sort");
    if (ret === undefined) {
      return;
    }
    return ret
      .split(/\n/)
      .map((value) => {
        return value.trim().match(/^package:(.*$)/)?.[1];
      })
      .filter(
        (item): item is Exclude<typeof item, undefined> => item !== undefined
      );
  }

  public async uninstall(packageName: string): Promise<boolean> {
    return !!(await this.shell(`pm uninstall -k --user 0 ${packageName}`));
  }

  public async goHome(): Promise<boolean> {
    return !!(await this.shell(
      "am start -a android.intent.action.MAIN -c android.intent.category.HOME"
    ));
  }

  public async tap(x: number, y: number): Promise<boolean> {
    return !!(await this.shell(`input tap ${x} ${y}`));
  }

  public async setAccelerometerRotation(enabled: boolean): Promise<boolean> {
    return !!(await this.shell(
      `settings put system accelerometer_rotation ${enabled ? 1 : 0}`
    ));
  }

  public async setScreenOffTimeout(enabled: boolean): Promise<boolean> {
    return !!(await this.shell(
      `settings put system screen_off_timeout ${enabled ? 60000 : 0}`
    ));
  }
}

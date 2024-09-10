// External libraries
import { makeAutoObservable, observable, runInAction } from "mobx";

// Internal modules
import { AdbUtil } from "@/app/adb-util";
import { GLOBAL_STATE } from "@/state/global-state";

export class KittingState {
  isRunning = false;
  isCompleted = false;

  constructor() {
    makeAutoObservable(this, {
      isRunning: observable,
      isCompleted: observable,
      start: false,
    });
  }

  clearCompleted() {
    this.isCompleted = false;
  }

  start = async () => {
    runInAction(() => {
      this.isRunning = true;
      this.isCompleted = false;
    });
    const adbUtil = new AdbUtil(GLOBAL_STATE.adb!!);

    // Disable screen rotation
    await adbUtil.setAccelerometerRotation(false);
    // Disable screen sleep
    await adbUtil.setScreenOffTimeout(false);

    const kittingAppPackageName = "com.example.kittingsample";

    // Install the kitting app
    await adbUtil.install(kittingAppPackageName, "/apk/KittingSample.apk");

    // Launch the app once to grant permissions
    await adbUtil.shell(
      `am start -n ${kittingAppPackageName}/.InitialStartActivity`
    );
    await this.wait3Seconds();

    // Grant AccessibilityService permissions
    await adbUtil.shell(
      `settings put secure enabled_accessibility_services ${kittingAppPackageName}/.KittingAccessibilityService`
    );
    await this.wait3Seconds();

    // Trigger an event to perform a tap
    await adbUtil.shell(
      `am start -n ${kittingAppPackageName}/.MainActivity --es type ChangeFontSize`
    );

    // Monitor for font size changes
    await this.waitChangeFontScale(adbUtil, 1.3);

    // Display the home screen
    await adbUtil.goHome();

    // Uninstall the kitting app
    await adbUtil.uninstall(kittingAppPackageName);

    // Enable screen rotation
    await adbUtil.setAccelerometerRotation(true);

    // Enable screen sleep
    await adbUtil.setScreenOffTimeout(true);

    GLOBAL_STATE.clearDevice();
    runInAction(() => {
      this.isRunning = false;
      this.isCompleted = true;
    });
  };

  private async wait3Seconds() {
    await new Promise((resolve) => {
      setTimeout(resolve, 3000);
    });
  }

  private async waitChangeFontScale(
    adbUtil: AdbUtil,
    targetScale: number
  ): Promise<boolean> {
    while (true) {
      await this.wait3Seconds();
      if (!GLOBAL_STATE.isConnectedDevice()) {
        return false;
      }

      const result = await adbUtil.shell(
        "dumpsys settings | grep name:font_scale | awk -F'value:' '{print $2}' | awk '{print $1}'"
      );
      if (!result) {
        return false;
      } else if (parseFloat(result) === targetScale) {
        return true;
      }
    }
  }
}

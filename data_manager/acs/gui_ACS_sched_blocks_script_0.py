# import tcs
# import daqctrl, inspect

# ------------------------------------------------------------------
# install the script by:
#   cd $INTROOT/config/scripts
#   ln -s $guiInstalDir/ctaOperatorGUI/ctaGuiBack/ctaGuiBack/acs/guiACS_schedBlocks_script0.py
# ------------------------------------------------------------------

# ------------------------------------------------------------------
from random import Random

rndGen = Random(10987268332)
waitTime = dict()
waitTime['config_daq'] = rndGen.randint(1, 3)
waitTime['config_camera'] = rndGen.randint(1, 5)
waitTime['config_mount'] = rndGen.randint(2, 7)
waitTime['finish_daq'] = rndGen.randint(1, 6)
waitTime['finish_camera'] = rndGen.randint(1, 3)
waitTime['finish_mount'] = rndGen.randint(1, 2)


def get_short_wait(duration, wait_type):
    return waitTime[wait_type] if duration > 1 else 1


# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
__phases__ = [
    "configuring",
    "config_daq",
    "config_camera",
    "config_mount",
    "take_data",
    "closing",
    "finish_daq",
    "finish_camera",
    "finish_mount",
]


# ------------------------------------------------------------------
#
# ------------------------------------------------------------------
def configuring():
    coords = observationBlock.src.coords
    p = None
    try:
        p = (coords.equatorial.ra, coords.equatorial.dec)
    except:
        pass
    if not p:
        try:
            p = (coords.horizontal.alt, coords.horizontal.az)
        except:
            pass
    if not p:
        try:
            p = (coords.galactic.lon, coords.galactic.lat)
        except:
            pass
    if not p:
        p = (0, 0)

    print "Coordinates used: (" + str(p[0]) + ", " + str(p[1]) + ")"

    try:
        divergence = schedulingBlock.config.instrument.pointing_mode.divergent_.divergence
        print "Divergence used: " + str(divergence)
    except:
        print "Pointing mode is not divergent"
        pass

    # resources.target = tcs.SkyEquatorialTarget(
    #     p[0], p[1], tcs.ICRS, tcs.J2000, 0.0, 0.0, 0.0, 0.0
    # )

    allowPhaseStart("config_daq")
    allowPhaseStart("config_camera")
    allowPhaseStart("config_mount")

    return


# ------------------------------------------------------------------
def config_daq():
    updatePhase("config_daq", "config_daq has began ...", 0)

    allowPhaseStart("config_camera")
    allowPhaseStart("config_mount")

    # operationStatus = daq().operationStatus
    # # Check daq operational status
    # if operationStatus != daqctrl.NOMINAL and operationStatus != daqctrl.IDLE:
    #   raise RuntimeError('DAQ status not idle/nominal: ' + operationStatus)

    # # Configure daq
    # daqConfigured = configureDAQ()
    # if not daqConfigured:
    #   raise RuntimeError('DAQ configuration failed')

    # add wiating time since waitToFinish is useless ............
    # telescopes.waitToFinish()
    wait(get_short_wait(blockDuration, 'config_daq'))

    updatePhase("config_daq", "config_daq has ended...", 100)

    return


# ------------------------------------------------------------------
def config_camera():
    updatePhase("config_camera", "config_camera has began ...", 0)

    allowPhaseStart("config_mount")

    # cameraConfig = schedulingBlock.config.camera_configuration
    # telescopes.configureCameras(cameraConfig)

    # add wiating time since waitToFinish is useless ............
    # telescopes.waitToFinish()
    wait(get_short_wait(blockDuration, 'config_camera'))

    updatePhase("config_camera", "config_camera has ended...", 100)

    return


# ------------------------------------------------------------------
def config_mount():
    updatePhase("config_mount", "config_mount has began ...", 0)

    # telescopes.startSlewing(resources.target)

    # add wiating time since waitToFinish is useless ............
    # telescopes.waitToFinish()
    wait(get_short_wait(blockDuration, 'config_mount'))

    updatePhase("config_mount", "config_mount has ended...", 100)

    return


# ------------------------------------------------------------------
def take_data():
    updatePhase("take_data", "take_data has began ...", 0)

    # daq().moveToNextOutputBlock(daqctrl.ZFITS_ZLIB)

    # resources.trackingDuration = blockDuration

    # telescopes.startTracking(resources.trackingDuration,resources.target)
    # telescopes.startDataTaking()

    # add wiating time since waitToFinish is useless ............
    # telescopes.waitToFinish()
    wait(blockDuration)

    # telescopes.stopDataTaking()

    updatePhase("take_data", "take_data has ended...", 100)

    return


# ------------------------------------------------------------------
def closing():
    allowPhaseStart("finish_daq")
    allowPhaseStart("finish_camera")
    allowPhaseStart("finish_mount")

    return


# ------------------------------------------------------------------
def finish_daq():
    updatePhase("finish_daq", "finish_daq has began ...", 0)

    allowPhaseStart("finish_camera")
    allowPhaseStart("finish_mount")

    # add wiating time since waitToFinish is useless ............
    # telescopes.waitToFinish()
    wait(get_short_wait(blockDuration, 'finish_daq'))

    updatePhase("finish_daq", "finish_daq has ended...", 100)

    return


# ------------------------------------------------------------------
def finish_camera():
    updatePhase("finish_camera", "finish_camera has began ...", 0)

    allowPhaseStart("finish_mount")

    # add wiating time since waitToFinish is useless ............
    # telescopes.waitToFinish()
    wait(get_short_wait(blockDuration, 'finish_camera'))

    updatePhase("finish_camera", "finish_camera has ended...", 100)

    return


# ------------------------------------------------------------------
def finish_mount():
    updatePhase("finish_mount", "finish_mount has began ...", 0)

    # add wiating time since waitToFinish is useless ............
    # telescopes.waitToFinish()
    wait(get_short_wait(blockDuration, 'finish_mount'))

    updatePhase("finish_mount", "finish_mount has ended...", 100)

    return


# ------------------------------------------------------------------
def cleanUp():
    pass

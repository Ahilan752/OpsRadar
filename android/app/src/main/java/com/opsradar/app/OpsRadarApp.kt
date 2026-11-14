package com.opsradar.app

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class OpsRadarApp : Application() {
    override fun onCreate() {
        super.onCreate()
    }
}

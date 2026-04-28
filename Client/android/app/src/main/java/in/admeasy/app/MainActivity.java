// package in.admeasy.app;

// import android.os.Bundle;
// import com.getcapacitor.BridgeActivity;

// public class MainActivity extends BridgeActivity {

//     @Override
//     protected void onCreate(Bundle savedInstanceState) {
//         setTheme(R.style.AppTheme_NoActionBarLaunch);
//         super.onCreate(savedInstanceState);
//     }
// }
package in.admeasy.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import io.capawesome.capacitorjs.plugins.googlesignin.GoogleSignInPlugin;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(GoogleSignInPlugin.class);
        setTheme(R.style.AppTheme_NoActionBarLaunch);
        super.onCreate(savedInstanceState);
    }
}
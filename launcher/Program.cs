using System;
using System.Diagnostics;
using System.IO;
using System.Threading;
using System.Windows.Forms;

namespace StoreInventoryLauncher
{
    class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            try
            {
                // Get the directory where this launcher is located
                string appDir = Path.GetDirectoryName(Application.ExecutablePath);
                string exePath = Path.Combine(appDir, "StoreInventory.exe");

                if (!File.Exists(exePath))
                {
                    MessageBox.Show(
                        "StoreInventory.exe not found in the application directory.",
                        "Store Inventory Manager - Error",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                    return;
                }

                // Start the server process (hidden)
                ProcessStartInfo startInfo = new ProcessStartInfo
                {
                    FileName = exePath,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden
                };

                Process serverProcess = Process.Start(startInfo);

                // Give the server time to start
                Thread.Sleep(2000);

                // Open the default browser
                Process.Start(new ProcessStartInfo
                {
                    FileName = "http://localhost:3000",
                    UseShellExecute = true
                });

                // Show notification
                MessageBox.Show(
                    "Store Inventory Manager is running.\n\n" +
                    "The application will open in your browser.\n\n" +
                    "To stop the application:\n" +
                    "• Close the browser and check Task Manager for 'StoreInventory.exe'",
                    "Store Inventory Manager",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information
                );
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    $"Error starting Store Inventory Manager:\n\n{ex.Message}",
                    "Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
        }
    }
}
